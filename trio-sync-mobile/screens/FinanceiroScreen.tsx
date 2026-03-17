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
    TextInput,
} from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { formatCurrency } from '../utils/formatters';
import { supabase } from '../lib/supabase';

export default function FinanceiroScreen() {
    const [transacoes, setTransacoes] = useState([]);
    const [filteredTransacoes, setFilteredTransacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [search, setSearch] = useState('');
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);

    const CATEGORIAS_RECEITA = [
        "Vendas",
        "Serviços",
        "Comissões",
        "Rendimentos",
        "Outros"
    ];

    const CATEGORIAS_DESPESA = [
        "Aluguel",
        "Água/Luz/Internet",
        "Fornecedores",
        "Salários",
        "Impostos",
        "Marketing",
        "Manutenção",
        "Alimentação",
        "Transporte",
        "Outros"
    ];

    // Form states
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tipo, setTipo] = useState<'receita' | 'despesa'>('receita');
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [categoria, setCategoria] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadTransacoes();
    }, []);

    useEffect(() => {
        if (search) {
            const lowerSearch = search.toLowerCase();
            const filtered = transacoes.filter((t: any) =>
                t.descricao?.toLowerCase().includes(lowerSearch) ||
                t.categoria?.toLowerCase().includes(lowerSearch)
            );
            setFilteredTransacoes(filtered);
        } else {
            setFilteredTransacoes(transacoes);
        }
    }, [search, transacoes]);

    const loadTransacoes = async () => {
        try {
            const { data, error } = await supabase
                .from('transacoes')
                .select('*')
                .order('data', { ascending: false, nullsFirst: false });

            if (error) throw error;
            setTransacoes(data || []);
            setFilteredTransacoes(data || []);
        } catch (error) {
            console.error('Erro ao carregar transações:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: any) => {
        setEditingId(item.id);
        setTipo(item.tipo);
        setDescricao(item.descricao);
        setValor(item.valor ? item.valor.toString() : '');
        setCategoria(item.categoria || '');
        setModalVisible(true);
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Excluir Transação',
            'Tem certeza que deseja excluir esta transação?',
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
                            Alert.alert('Sucesso', 'Transação excluída!');
                            loadTransacoes();
                        } catch (error: any) {
                            Alert.alert('Erro', error.message);
                        }
                    },
                },
            ]
        );
    };

    const handleSave = async () => {
        if (!descricao || !valor) {
            Alert.alert('Erro', 'Preencha descrição e valor');
            return;
        }

        setSaving(true);
        try {
            const transacaoData = {
                tipo,
                descricao,
                valor: parseFloat(valor),
                categoria,
                status: 'pendente',
            };

            if (editingId) {
                const { error } = await supabase
                    .from('transacoes')
                    .update(transacaoData)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('transacoes')
                    .insert([transacaoData]);
                if (error) throw error;
            }

            Alert.alert('Sucesso', `Transação ${editingId ? 'atualizada' : 'cadastrada'}!`);
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
        setTipo('receita');
        setDescricao('');
        setValor('');
        setCategoria('');
    };

    const getTotalReceitas = () => {
        return transacoes
            .filter((t: any) => t.tipo === 'receita')
            .reduce((sum: number, t: any) => sum + (t.valor || 0), 0);
    };

    const getTotalDespesas = () => {
        return transacoes
            .filter((t: any) => t.tipo === 'despesa')
            .reduce((sum: number, t: any) => sum + (t.valor || 0), 0);
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
            <View style={styles.summary}>
                <View style={[styles.summaryCard, { backgroundColor: Colors.success }]}>
                    <Text style={styles.summaryLabel}>Receitas</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(getTotalReceitas())}</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: Colors.error }]}>
                    <Text style={styles.summaryLabel}>Despesas</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(getTotalDespesas())}</Text>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar transação..."
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor={Colors.textSecondary}
                />
                <Feather name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            </View>

            <FlatList
                data={filteredTransacoes}
                keyExtractor={(item: any) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardContent}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{item.descricao}</Text>
                                <Text style={[
                                    styles.cardValue,
                                    { color: item.tipo === 'receita' ? Colors.success : Colors.error }
                                ]}>
                                    {item.tipo === 'receita' ? <Feather name="arrow-up-circle" size={16} /> : <Feather name="arrow-down-circle" size={16} />}
                                    {' '}{formatCurrency(item.valor || 0)}
                                </Text>
                            </View>
                            <Text style={styles.cardSubtitle}><Feather name="tag" size={14} /> {item.categoria}</Text>
                            <Text style={styles.cardText}><Feather name="calendar" size={14} /> {new Date(item.data).toLocaleDateString('pt-BR')}</Text>
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
                        <Text style={styles.emptyText}>Nenhuma transação encontrada</Text>
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
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingId ? 'Editar Transação' : 'Nova Transação'}
                        </Text>

                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[styles.typeButton, tipo === 'receita' && styles.typeButtonActive]}
                                onPress={() => setTipo('receita')}
                            >
                                <Text style={[styles.typeButtonText, tipo === 'receita' && styles.typeButtonTextActive]}>
                                    Receita
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeButton, tipo === 'despesa' && styles.typeButtonActive]}
                                onPress={() => setTipo('despesa')}
                            >
                                <Text style={[styles.typeButtonText, tipo === 'despesa' && styles.typeButtonTextActive]}>
                                    Despesa
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Input
                            label="Descrição *"
                            placeholder="Ex: Venda de Produto"
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
                                        data={tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA}
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
    summary: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    summaryCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    summaryLabel: {
        color: Colors.textInverted,
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    summaryValue: {
        color: Colors.textInverted,
        fontSize: 20,
        fontWeight: 'bold',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: Colors.background,
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        backgroundColor: Colors.surface,
        padding: 12,
        paddingLeft: 44,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        color: Colors.textPrimary,
    },
    searchIcon: {
        position: 'absolute',
        left: 28,
        top: 12,
    },
    listContent: {
        paddingBottom: 80,
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
    actionText: {
        fontSize: 18,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        color: Colors.textPrimary,
        flex: 1,
        fontWeight: 'bold',
    },
    cardValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    cardSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 8,
    },
    cardText: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    empty: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: Colors.textSecondary,
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
    fabText: {
        fontSize: 32,
        color: Colors.textInverted,
        marginTop: -2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 24,
        textAlign: 'center',
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    typeButton: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        backgroundColor: Colors.inputBackground,
    },
    typeButtonActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary,
    },
    typeButtonText: {
        fontSize: 16,
        color: '#4b5563',
        fontWeight: '600',
    },
    typeButtonTextActive: {
        color: Colors.textInverted,
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
        width: '100%',
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
