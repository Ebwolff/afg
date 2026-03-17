import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { formatCurrency } from '../utils/formatters';
import { Transacao, CATEGORIAS_RECEITA, STATUS_OPTIONS } from '../types';
import { supabase } from '../lib/supabase';

export default function ContasReceberScreen() {
    const [transacoes, setTransacoes] = useState<Transacao[]>([]);
    const [filteredTransacoes, setFilteredTransacoes] = useState<Transacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [statusFilter, setStatusFilter] = useState('todas');
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);

    // Form states
    const [editingId, setEditingId] = useState<string | null>(null);
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [categoria, setCategoria] = useState('');
    const [dataVencimento, setDataVencimento] = useState('');
    const [cliente, setCliente] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadTransacoes();
    }, []);

    useEffect(() => {
        filterTransacoes();
    }, [statusFilter, transacoes]);

    const filterTransacoes = () => {
        if (statusFilter === 'todas') {
            setFilteredTransacoes(transacoes);
        } else {
            setFilteredTransacoes(transacoes.filter(t => t.status === statusFilter));
        }
    };

    const loadTransacoes = async () => {
        try {
            const { data, error } = await supabase
                .from('transacoes')
                .select('*')
                .eq('tipo', 'receita')
                .order('data_vencimento', { ascending: false });

            if (error) throw error;
            setTransacoes(data || []);
        } catch (error) {
            console.error('Erro ao carregar contas a receber:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: Transacao) => {
        setEditingId(item.id);
        setDescricao(item.descricao);
        setValor(item.valor.toString());
        setCategoria(item.categoria || '');
        setDataVencimento(item.data_vencimento?.split('T')[0] || '');
        setCliente(item.fornecedor_cliente || '');
        setObservacoes(item.observacoes || '');
        setModalVisible(true);
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Excluir Conta',
            'Tem certeza que deseja excluir esta conta?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('transacoes')
                                .delete()
                                .eq('id', id);

                            if (error) throw error;
                            Alert.alert('Sucesso', 'Conta excluída!');
                            loadTransacoes();
                        } catch (error: any) {
                            Alert.alert('Erro', error.message);
                        }
                    },
                },
            ]
        );
    };

    const handleRegistrarRecebimento = async (item: Transacao) => {
        try {
            const { error } = await supabase
                .from('transacoes')
                .update({
                    status: 'pago',
                    data_pagamento: new Date().toISOString(),
                })
                .eq('id', item.id);

            if (error) throw error;
            Alert.alert('Sucesso', 'Recebimento registrado!');
            loadTransacoes();
        } catch (error: any) {
            Alert.alert('Erro', error.message);
        }
    };

    const handleCancelar = async (item: Transacao) => {
        try {
            const { error } = await supabase
                .from('transacoes')
                .update({ status: 'cancelado' })
                .eq('id', item.id);

            if (error) throw error;
            Alert.alert('Sucesso', 'Conta cancelada!');
            loadTransacoes();
        } catch (error: any) {
            Alert.alert('Erro', error.message);
        }
    };

    const handleSave = async () => {
        if (!descricao || !valor) {
            Alert.alert('Erro', 'Preencha descrição e valor');
            return;
        }

        setSaving(true);
        try {
            const contaData: any = {
                tipo: 'receita',
                descricao,
                valor: parseFloat(valor),
                categoria,
                status: 'pendente',
                fornecedor_cliente: cliente,
                observacoes,
            };

            if (dataVencimento) {
                contaData.data_vencimento = new Date(dataVencimento).toISOString();
            }

            if (editingId) {
                const { error } = await supabase
                    .from('transacoes')
                    .update(contaData)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('transacoes')
                    .insert([contaData]);
                if (error) throw error;
            }

            Alert.alert('Sucesso', `Conta ${editingId ? 'atualizada' : 'cadastrada'}!`);
            setModalVisible(false);
            resetForm();
            loadTransacoes();
        } catch (error: any) {
            Alert.alert('Erro', error.message);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setDescricao('');
        setValor('');
        setCategoria('');
        setDataVencimento('');
        setCliente('');
        setObservacoes('');
    };

    const getSummary = () => {
        const total = transacoes.reduce((sum, t) => sum + (t.valor || 0), 0);
        const recebido = transacoes.filter(t => t.status === 'pago').reduce((sum, t) => sum + (t.valor || 0), 0);
        const pendente = transacoes.filter(t => t.status === 'pendente').reduce((sum, t) => sum + (t.valor || 0), 0);
        const atrasado = transacoes.filter(t => {
            if (t.status !== 'pendente' || !t.data_vencimento) return false;
            return new Date(t.data_vencimento) < new Date();
        }).reduce((sum, t) => sum + (t.valor || 0), 0);

        return { total, recebido, pendente, atrasado };
    };

    const summary = getSummary();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pago': return Colors.success;
            case 'pendente': return Colors.warning;
            case 'cancelado': return Colors.textSecondary;
            case 'atrasado': return Colors.error;
            default: return Colors.textSecondary;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pago': return 'Recebido';
            case 'pendente': return 'Pendente';
            case 'cancelado': return 'Cancelado';
            case 'atrasado': return 'Atrasado';
            default: return status;
        }
    };

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Summary Cards */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryContainer}>
                <View style={[styles.summaryCard, { backgroundColor: Colors.info }]}>
                    <Text style={styles.summaryLabel}>Total</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(summary.total)}</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: Colors.success }]}>
                    <Text style={styles.summaryLabel}>Recebido</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(summary.recebido)}</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: Colors.warning }]}>
                    <Text style={styles.summaryLabel}>Pendente</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(summary.pendente)}</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: Colors.error }]}>
                    <Text style={styles.summaryLabel}>Atrasado</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(summary.atrasado)}</Text>
                </View>
            </ScrollView>

            {/* Status Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
                {STATUS_OPTIONS.map(option => (
                    <TouchableOpacity
                        key={option.value}
                        style={[
                            styles.filterButton,
                            statusFilter === option.value && styles.filterButtonActive
                        ]}
                        onPress={() => setStatusFilter(option.value)}
                    >
                        <Text style={[
                            styles.filterButtonText,
                            statusFilter === option.value && styles.filterButtonTextActive
                        ]}>
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <FlatList
                data={filteredTransacoes}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardContent}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{item.descricao}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                                    <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                                </View>
                            </View>
                            <Text style={styles.cardValue}>{formatCurrency(item.valor || 0)}</Text>
                            {item.categoria && (
                                <Text style={styles.cardSubtitle}>
                                    <Feather name="tag" size={14} /> {item.categoria}
                                </Text>
                            )}
                            {item.data_vencimento && (
                                <Text style={styles.cardText}>
                                    <Feather name="calendar" size={14} /> Vencimento: {new Date(item.data_vencimento).toLocaleDateString('pt-BR')}
                                </Text>
                            )}
                            {item.fornecedor_cliente && (
                                <Text style={styles.cardText}>
                                    <Feather name="user" size={14} /> {item.fornecedor_cliente}
                                </Text>
                            )}

                            {item.status === 'pendente' && (
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={[styles.smallButton, { backgroundColor: Colors.success }]}
                                        onPress={() => handleRegistrarRecebimento(item)}
                                    >
                                        <Feather name="check" size={16} color="#fff" />
                                        <Text style={styles.smallButtonText}>Registrar Recebimento</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.smallButton, { backgroundColor: Colors.textSecondary }]}
                                        onPress={() => handleCancelar(item)}
                                    >
                                        <Feather name="x" size={16} color="#fff" />
                                        <Text style={styles.smallButtonText}>Cancelar</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                        <View style={styles.cardActions}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.editButton]}
                                onPress={() => handleEdit(item)}
                            >
                                <Feather name="edit-2" size={20} color={Colors.info} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.deleteButton]}
                                onPress={() => handleDelete(item.id)}
                            >
                                <Feather name="trash-2" size={20} color={Colors.error} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Feather name="inbox" size={48} color={Colors.textSecondary} />
                        <Text style={styles.emptyText}>Nenhuma conta a receber encontrada</Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => {
                    resetForm();
                    setModalVisible(true);
                }}
            >
                <Feather name="plus" size={32} color={Colors.textInverted} />
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <ScrollView contentContainerStyle={styles.modalScrollContent}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                {editingId ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}
                            </Text>

                            <Input
                                label="Descrição *"
                                placeholder="Ex: Venda de serviço"
                                value={descricao}
                                onChangeText={setDescricao}
                            />
                            <Input
                                label="Valor (R$) *"
                                placeholder="0.00"
                                value={valor}
                                onChangeText={setValor}
                                keyboardType="decimal-pad"
                            />
                            <Input
                                label="Data de Vencimento"
                                placeholder="AAAA-MM-DD"
                                value={dataVencimento}
                                onChangeText={setDataVencimento}
                            />
                            <TouchableOpacity
                                onPress={() => setCategoryModalVisible(true)}
                                style={styles.categorySelector}
                            >
                                <Text style={styles.categoryLabel}>Categoria</Text>
                                <Text style={[styles.categoryValue, !categoria && styles.placeholder]}>
                                    {categoria || 'Selecione uma categoria'}
                                </Text>
                                <Feather name="chevron-down" size={20} color={Colors.textSecondary} style={styles.chevron} />
                            </TouchableOpacity>
                            <Input
                                label="Cliente"
                                placeholder="Nome do cliente"
                                value={cliente}
                                onChangeText={setCliente}
                            />
                            <Input
                                label="Observações"
                                placeholder="Observações adicionais"
                                value={observacoes}
                                onChangeText={setObservacoes}
                                multiline
                            />

                            <View style={styles.modalButtons}>
                                <Button
                                    title="Cancelar"
                                    variant="secondary"
                                    onPress={() => {
                                        setModalVisible(false);
                                        resetForm();
                                    }}
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    title="Salvar"
                                    onPress={handleSave}
                                    loading={saving}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            {/* Category Modal */}
            <Modal
                visible={categoryModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setCategoryModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.categoryModalContent}>
                        <View style={styles.categoryHeader}>
                            <Text style={styles.modalTitle}>Selecione a Categoria</Text>
                            <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                                <Feather name="x" size={24} color={Colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={CATEGORIAS_RECEITA}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.categoryItem}
                                    onPress={() => {
                                        setCategoria(item);
                                        setCategoryModalVisible(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.categoryItemText,
                                        categoria === item && styles.categoryItemTextActive
                                    ]}>
                                        {item}
                                    </Text>
                                    {categoria === item && (
                                        <Feather name="check" size={20} color={Colors.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryContainer: {
        paddingVertical: 16,
        paddingHorizontal: 8,
    },
    summaryCard: {
        padding: 16,
        borderRadius: 16,
        marginHorizontal: 8,
        minWidth: 130,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    summaryLabel: {
        color: Colors.textInverted,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    summaryValue: {
        color: Colors.textInverted,
        fontSize: 18,
        fontWeight: 'bold',
    },
    filterContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        marginRight: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterButtonText: {
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    filterButtonTextActive: {
        color: Colors.textInverted,
    },
    listContent: {
        paddingBottom: 100,
    },
    card: {
        backgroundColor: Colors.surface,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    cardContent: {
        flex: 1,
        padding: 16,
    },
    cardActions: {
        width: 60,
        borderLeftWidth: 1,
        borderLeftColor: Colors.background,
    },
    actionButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButton: {
        backgroundColor: Colors.lightBlue,
    },
    deleteButton: {
        backgroundColor: Colors.lightRed,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: Colors.textInverted,
        fontSize: 12,
        fontWeight: '600',
    },
    cardValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.success,
        marginBottom: 8,
    },
    cardSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    cardText: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    smallButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4,
    },
    smallButtonText: {
        color: Colors.textInverted,
        fontSize: 12,
        fontWeight: '600',
    },
    empty: {
        padding: 60,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: 16,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
    },
    modalScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: Colors.surface,
        borderRadius: 24,
        padding: 24,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 24,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    categorySelector: {
        backgroundColor: Colors.inputBackground,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 16,
    },
    categoryLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    categoryValue: {
        fontSize: 16,
        color: Colors.textPrimary,
    },
    placeholder: {
        color: Colors.textSecondary,
    },
    chevron: {
        position: 'absolute',
        right: 12,
        top: 20,
    },
    categoryModalContent: {
        backgroundColor: Colors.surface,
        borderRadius: 24,
        padding: 24,
        maxHeight: '80%',
        marginHorizontal: 20,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    categoryItemText: {
        fontSize: 16,
        color: Colors.textPrimary,
    },
    categoryItemTextActive: {
        color: Colors.primary,
        fontWeight: 'bold',
    },
});
