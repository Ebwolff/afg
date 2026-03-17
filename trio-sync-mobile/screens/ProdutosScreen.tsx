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
import { formatCurrency } from '../utils/formatters';

export default function ProdutosScreen() {
    const [produtos, setProdutos] = useState([]);
    const [filteredProdutos, setFilteredProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [search, setSearch] = useState('');

    // Form states
    const [editingId, setEditingId] = useState<string | null>(null);
    const [nome, setNome] = useState('');
    const [categoria, setCategoria] = useState('');
    const [tipo, setTipo] = useState('');
    const [valor, setValor] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadProdutos();
    }, []);

    useEffect(() => {
        if (search) {
            const lowerSearch = search.toLowerCase();
            const filtered = produtos.filter((p: any) =>
                p.nome?.toLowerCase().includes(lowerSearch) ||
                p.categoria?.toLowerCase().includes(lowerSearch) ||
                p.tipo?.toLowerCase().includes(lowerSearch)
            );
            setFilteredProdutos(filtered);
        } else {
            setFilteredProdutos(produtos);
        }
    }, [search, produtos]);

    const loadProdutos = async () => {
        try {
            const { data, error } = await supabase
                .from('produtos')
                .select('*')
                .order('nome', { ascending: true });

            if (error) throw error;
            setProdutos(data || []);
            setFilteredProdutos(data || []);
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: any) => {
        setEditingId(item.id);
        setNome(item.nome);
        setCategoria(item.categoria);
        setTipo(item.tipo);
        setValor(item.valor_base ? item.valor_base.toString() : '');
        setModalVisible(true);
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Excluir Produto',
            'Tem certeza que deseja excluir este produto?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('produtos')
                                .delete()
                                .eq('id', id);

                            if (error) throw error;
                            Alert.alert('Sucesso', 'Produto excluído!');
                            loadProdutos();
                        } catch (error: any) {
                            Alert.alert('Erro', error.message);
                        }
                    },
                },
            ]
        );
    };

    const handleSave = async () => {
        if (!nome || !categoria || !tipo) {
            Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
            return;
        }

        setSaving(true);
        try {
            const produtoData = {
                nome,
                categoria,
                tipo,
                valor_base: valor ? parseFloat(valor) : null,
                ativo: true,
            };

            if (editingId) {
                const { error } = await supabase
                    .from('produtos')
                    .update(produtoData)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('produtos')
                    .insert([produtoData]);
                if (error) throw error;
            }

            Alert.alert('Sucesso', `Produto ${editingId ? 'atualizado' : 'cadastrado'}!`);
            setModalVisible(false);
            resetForm();
            loadProdutos();
        } catch (error: any) {
            Alert.alert('Erro', error.message);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setNome('');
        setCategoria('');
        setTipo('');
        setValor('');
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
                    placeholder="Buscar produto..."
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor={Colors.textSecondary}
                />
                <Feather name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            </View>

            <FlatList
                data={filteredProdutos}
                keyExtractor={(item: any) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>{item.nome}</Text>
                            <Text style={styles.cardSubtitle}><Feather name="tag" size={14} /> {item.categoria} • {item.tipo}</Text>
                            {item.valor_base && (
                                <Text style={styles.cardPrice}>R$ {item.valor_base.toFixed(2)}</Text>
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
                        <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
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
                            {editingId ? 'Editar Produto' : 'Novo Produto'}
                        </Text>

                        <Input
                            label="Nome do Produto *"
                            placeholder="Ex: Consultoria Financeira"
                            value={nome}
                            onChangeText={setNome}
                        />
                        <Input
                            label="Categoria *"
                            placeholder="Ex: Serviços"
                            value={categoria}
                            onChangeText={setCategoria}
                        />
                        <Input
                            label="Tipo *"
                            placeholder="Ex: Hora Técnica"
                            value={tipo}
                            onChangeText={setTipo}
                        />
                        <Input
                            label="Valor Base (R$)"
                            placeholder="0.00"
                            value={valor}
                            onChangeText={setValor}
                            keyboardType="decimal-pad"
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
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    cardPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.primary,
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
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
});
