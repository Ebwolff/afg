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

export default function AgendaScreen() {
    const [eventos, setEventos] = useState([]);
    const [filteredEventos, setFilteredEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [search, setSearch] = useState('');

    // Form states
    const [editingId, setEditingId] = useState<string | null>(null);
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [tipo, setTipo] = useState('');
    const [local, setLocal] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadEventos();
    }, []);

    useEffect(() => {
        if (search) {
            const lowerSearch = search.toLowerCase();
            const filtered = eventos.filter((e: any) =>
                e.titulo?.toLowerCase().includes(lowerSearch) ||
                e.tipo?.toLowerCase().includes(lowerSearch) ||
                e.local?.toLowerCase().includes(lowerSearch)
            );
            setFilteredEventos(filtered);
        } else {
            setFilteredEventos(eventos);
        }
    }, [search, eventos]);

    const loadEventos = async () => {
        try {
            const { data, error } = await supabase
                .from('eventos')
                .select('*')
                .order('data_inicio', { ascending: false });

            if (error) throw error;
            setEventos(data || []);
            setFilteredEventos(data || []);
        } catch (error) {
            console.error('Erro ao carregar eventos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: any) => {
        setEditingId(item.id);
        setTitulo(item.titulo);
        setDescricao(item.descricao || '');
        setTipo(item.tipo);
        setLocal(item.local || '');
        setModalVisible(true);
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Excluir Evento',
            'Tem certeza que deseja excluir este evento?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('eventos')
                                .delete()
                                .eq('id', id);

                            if (error) throw error;
                            Alert.alert('Sucesso', 'Evento excluído!');
                            loadEventos();
                        } catch (error: any) {
                            Alert.alert('Erro', error.message);
                        }
                    },
                },
            ]
        );
    };

    const handleSave = async () => {
        if (!titulo || !tipo) {
            Alert.alert('Erro', 'Preencha título e tipo');
            return;
        }

        setSaving(true);
        try {
            const eventoData: any = {
                titulo,
                descricao,
                tipo,
                local,
            };

            if (!editingId) {
                eventoData.data_inicio = new Date().toISOString();
            }

            if (editingId) {
                const { error } = await supabase
                    .from('eventos')
                    .update(eventoData)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('eventos')
                    .insert([eventoData]);
                if (error) throw error;
            }

            Alert.alert('Sucesso', `Evento ${editingId ? 'atualizado' : 'cadastrado'}!`);
            setModalVisible(false);
            resetForm();
            loadEventos();
        } catch (error: any) {
            Alert.alert('Erro', error.message);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setTitulo('');
        setDescricao('');
        setTipo('');
        setLocal('');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
                    placeholder="Buscar evento..."
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor={Colors.textSecondary}
                />
                <Feather name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            </View>

            <FlatList
                data={filteredEventos}
                keyExtractor={(item: any) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>{item.titulo}</Text>
                            <Text style={styles.cardType}><Feather name="tag" size={14} /> {item.tipo}</Text>
                            <Text style={styles.cardDate}><Feather name="calendar" size={14} /> {formatDate(item.data_inicio)}</Text>
                            {item.local && (
                                <Text style={styles.cardLocal}><Feather name="map-pin" size={14} /> {item.local}</Text>
                            )}
                            {item.descricao && (
                                <Text style={styles.cardDescription}><Feather name="file-text" size={14} /> {item.descricao}</Text>
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
                        <Text style={styles.emptyText}>Nenhum evento encontrado</Text>
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
                            {editingId ? 'Editar Evento' : 'Novo Evento'}
                        </Text>

                        <Input
                            label="Título *"
                            placeholder="Ex: Reunião de Planejamento"
                            value={titulo}
                            onChangeText={setTitulo}
                        />
                        <Input
                            label="Tipo *"
                            placeholder="Ex: Reunião"
                            value={tipo}
                            onChangeText={setTipo}
                        />
                        <Input
                            label="Local"
                            placeholder="Ex: Sala 1 ou Online"
                            value={local}
                            onChangeText={setLocal}
                        />
                        <Input
                            label="Descrição"
                            placeholder="Detalhes do evento..."
                            value={descricao}
                            onChangeText={setDescricao}
                            multiline
                            numberOfLines={4}
                            style={{ height: 100, textAlignVertical: 'top' }}
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
    cardType: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '600',
        marginBottom: 8,
    },
    cardDate: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    cardLocal: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    cardDescription: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 8,
        fontStyle: 'italic',
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
