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
import { supabase } from '../lib/supabase';

export default function AtendimentosScreen() {
    const [atendimentos, setAtendimentos] = useState([]);
    const [filteredAtendimentos, setFilteredAtendimentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [search, setSearch] = useState('');

    // Form states
    const [editingId, setEditingId] = useState<string | null>(null);
    const [clienteNome, setClienteNome] = useState('');
    const [clienteContato, setClienteContato] = useState('');
    const [tipoSolicitacao, setTipoSolicitacao] = useState('');
    const [descricao, setDescricao] = useState('');
    const [status, setStatus] = useState('aguardando');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadAtendimentos();
    }, []);

    useEffect(() => {
        if (search) {
            const lowerSearch = search.toLowerCase();
            const filtered = atendimentos.filter((a: any) =>
                a.cliente_nome?.toLowerCase().includes(lowerSearch) ||
                a.tipo_solicitacao?.toLowerCase().includes(lowerSearch) ||
                a.status?.toLowerCase().includes(lowerSearch)
            );
            setFilteredAtendimentos(filtered);
        } else {
            setFilteredAtendimentos(atendimentos);
        }
    }, [search, atendimentos]);

    const loadAtendimentos = async () => {
        try {
            const { data, error } = await supabase
                .from('atendimentos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAtendimentos(data || []);
            setFilteredAtendimentos(data || []);
        } catch (error) {
            console.error('Erro ao carregar atendimentos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: any) => {
        setEditingId(item.id);
        setClienteNome(item.cliente_nome);
        setClienteContato(item.cliente_contato);
        setTipoSolicitacao(item.tipo_solicitacao);
        setDescricao(item.descricao || '');
        setStatus(item.status);
        setModalVisible(true);
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Excluir Atendimento',
            'Tem certeza que deseja excluir este atendimento?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('atendimentos')
                                .delete()
                                .eq('id', id);

                            if (error) throw error;
                            Alert.alert('Sucesso', 'Atendimento excluído!');
                            loadAtendimentos();
                        } catch (error: any) {
                            Alert.alert('Erro', error.message);
                        }
                    },
                },
            ]
        );
    };

    const handleSave = async () => {
        if (!clienteNome || !clienteContato || !tipoSolicitacao) {
            Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
            return;
        }

        setSaving(true);
        try {
            const atendimentoData: any = {
                cliente_nome: clienteNome,
                cliente_contato: clienteContato,
                tipo_solicitacao: tipoSolicitacao,
                descricao,
            };

            if (editingId) {
                atendimentoData.status = status;
                const { error } = await supabase
                    .from('atendimentos')
                    .update(atendimentoData)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                atendimentoData.status = 'aguardando';
                const { error } = await supabase
                    .from('atendimentos')
                    .insert([atendimentoData]);
                if (error) throw error;
            }

            Alert.alert('Sucesso', `Atendimento ${editingId ? 'atualizado' : 'cadastrado'}!`);
            setModalVisible(false);
            resetForm();
            loadAtendimentos();
        } catch (error: any) {
            Alert.alert('Erro', error.message);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setClienteNome('');
        setClienteContato('');
        setTipoSolicitacao('');
        setDescricao('');
        setStatus('aguardando');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'aguardando': return Colors.warning;
            case 'em_andamento': return Colors.info;
            case 'concluido': return Colors.success;
            default: return Colors.textSecondary;
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
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar atendimento..."
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor={Colors.textSecondary}
                />
                <Feather name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            </View>

            <FlatList
                data={filteredAtendimentos}
                keyExtractor={(item: any) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardContent}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{item.cliente_nome}</Text>
                                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                                    <Text style={styles.badgeText}>{item.status?.replace('_', ' ').toUpperCase()}</Text>
                                </View>
                            </View>
                            <Text style={styles.cardSubtitle}><Feather name="user" size={14} /> {item.cliente_nome}</Text>
                            <Text style={styles.cardText}><Feather name="file-text" size={14} /> {item.descricao}</Text>
                            <View style={styles.statusContainer}>
                                <Text style={[
                                    styles.statusText,
                                    item.status === 'concluido' ? styles.statusConcluido :
                                        item.status === 'em_andamento' ? styles.statusAndamento : styles.statusAguardando
                                ]}>
                                    {item.status === 'concluido' ? <Feather name="check-circle" size={12} /> :
                                        item.status === 'em_andamento' ? <Feather name="clock" size={12} /> : <Feather name="alert-circle" size={12} />}
                                    {' '}{item.status?.replace('_', ' ').toUpperCase()}
                                </Text>
                            </View>
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
                        <Text style={styles.emptyText}>Nenhum atendimento encontrado</Text>
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
                            {editingId ? 'Editar Atendimento' : 'Novo Atendimento'}
                        </Text>

                        <Input
                            label="Nome do Cliente *"
                            placeholder="Ex: Maria Oliveira"
                            value={clienteNome}
                            onChangeText={setClienteNome}
                        />
                        <Input
                            label="Contato *"
                            placeholder="(00) 00000-0000"
                            value={clienteContato}
                            onChangeText={setClienteContato}
                            keyboardType="phone-pad"
                        />
                        <Input
                            label="Tipo de Solicitação *"
                            placeholder="Ex: Suporte Técnico"
                            value={tipoSolicitacao}
                            onChangeText={setTipoSolicitacao}
                        />
                        <Input
                            label="Descrição"
                            placeholder="Detalhes do atendimento..."
                            value={descricao}
                            onChangeText={setDescricao}
                            multiline
                            numberOfLines={4}
                            style={{ height: 100, textAlignVertical: 'top' }}
                        />

                        {editingId && (
                            <View style={styles.statusContainer}>
                                <Text style={styles.statusLabel}>Status:</Text>
                                <View style={styles.statusButtons}>
                                    {['aguardando', 'em_andamento', 'concluido'].map((s) => (
                                        <TouchableOpacity
                                            key={s}
                                            style={[
                                                styles.statusButton,
                                                status === s && { backgroundColor: getStatusColor(s), borderColor: getStatusColor(s) }
                                            ]}
                                            onPress={() => setStatus(s)}
                                        >
                                            <Text style={[
                                                styles.statusButtonText,
                                                status === s && { color: '#fff' }
                                            ]}>
                                                {s.replace('_', ' ')}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

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
    searchContainer: {
        padding: 16,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        backgroundColor: Colors.inputBackground,
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
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        flex: 1,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: Colors.textInverted,
        fontSize: 12,
        fontWeight: '600',
    },
    cardSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    cardText: {
        fontSize: 14,
        color: '#4b5563',
        marginTop: 4,
    },
    statusContainer: {
        marginTop: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusConcluido: {
        color: Colors.success,
    },
    statusAndamento: {
        color: Colors.info,
    },
    statusAguardando: {
        color: Colors.warning,
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
    statusLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#374151',
    },
    statusButtons: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    statusButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statusButtonText: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
});
