import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Modal,
    Animated,
    Dimensions,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/formatters';

const { width, height } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: any) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(-300)).current;

    const [stats, setStats] = useState({
        clientes: 0,
        atendimentos: 0,
        receitas: 0,
        despesas: 0,
    });

    const menuItems = [
        { title: 'Início', icon: 'home', screen: 'Dashboard', color: Colors.textSecondary },
        { title: 'Clientes', icon: 'users', screen: 'Clientes', color: Colors.info },
        { title: 'Produtos', icon: 'package', screen: 'Produtos', color: '#8b5cf6' },
        { title: 'Atendimentos', icon: 'headphones', screen: 'Atendimentos', color: '#ec4899' },
        { title: 'Financeiro', icon: 'dollar-sign', screen: 'Financeiro', color: Colors.success },
        { title: 'Contas a Pagar', icon: 'trending-down', screen: 'ContasPagar', color: Colors.error },
        { title: 'Contas a Receber', icon: 'trending-up', screen: 'ContasReceber', color: Colors.success },
        { title: 'Agenda', icon: 'calendar', screen: 'Agenda', color: Colors.warning },
        { title: 'Relatórios', icon: 'bar-chart-2', screen: 'Relatorios', color: '#6366f1' },
        { title: 'Simulador', icon: 'percent', screen: 'Simulador', color: Colors.primary },
        { title: 'Banners', icon: 'image', screen: 'Banners', color: '#f43f5e' },
    ];

    const loadStats = async () => {
        try {
            console.log('[Dashboard] Carregando estatísticas...');

            // Usar supabase client para buscar dados (inclui token de autenticação)
            const { data: clientes, error: clientesError } = await supabase
                .from('clientes')
                .select('id');

            if (clientesError) {
                console.error('Erro clientes:', clientesError);
                Alert.alert(
                    'Erro de Conexão',
                    'Não foi possível conectar ao banco de dados. Verifique sua conexão com a internet.\n\nDetalhes: ' + clientesError.message
                );
            }
            const clientesCount = clientes?.length || 0;

            // Buscar atendimentos aguardando
            const { data: atendimentos, error: atendimentosError } = await supabase
                .from('atendimentos')
                .select('id')
                .eq('status', 'aguardando');

            if (atendimentosError) console.error('Erro atendimentos:', atendimentosError);
            const atendimentosCount = atendimentos?.length || 0;

            // Buscar transações
            const { data: transacoes, error: transacoesError } = await supabase
                .from('transacoes')
                .select('tipo, valor');

            if (transacoesError) console.error('Erro transações:', transacoesError);

            console.log('[Dashboard] Transações carregadas:', transacoes?.length || 0, 'registros');

            // Calcular receitas
            const receitas = transacoes
                ? transacoes
                    .filter((t: any) => t.tipo === 'receita')
                    .reduce((sum: number, t: any) => sum + Number(t.valor || 0), 0)
                : 0;

            // Calcular despesas
            const despesas = transacoes
                ? transacoes
                    .filter((t: any) => t.tipo === 'despesa')
                    .reduce((sum: number, t: any) => sum + Number(t.valor || 0), 0)
                : 0;

            console.log('[Dashboard] Estatísticas calculadas:', { clientesCount, atendimentosCount, receitas, despesas });

            setStats({
                clientes: clientesCount,
                atendimentos: atendimentosCount,
                receitas,
                despesas,
            });
        } catch (error: any) {
            console.error('[Dashboard] Erro ao carregar estatísticas:', error);
            Alert.alert(
                'Erro de Conexão',
                'Não foi possível carregar os dados. Por favor, verifique sua conexão com a internet e tente novamente.\n\nDetalhes: ' + (error?.message || 'Erro desconhecido')
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadStats();
    };

    const toggleMenu = () => {
        if (menuVisible) {
            Animated.timing(slideAnim, {
                toValue: -300,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setMenuVisible(false));
        } else {
            setMenuVisible(true);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    };

    const navigateTo = (screen: string) => {
        toggleMenu();
        if (screen !== 'Dashboard') {
            navigation.navigate(screen);
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
            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
                    <Feather name="menu" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sistema de Gestão</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.welcomeSection}>
                    <Text style={styles.welcomeTitle}>Bem-vindo!</Text>
                    <Text style={styles.welcomeSubtitle}>Resumo das suas atividades</Text>
                </View>

                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: Colors.info }]}>
                        <Text style={styles.statNumber}>{stats.clientes}</Text>
                        <Text style={styles.statLabel}>Clientes</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#ec4899' }]}>
                        <Text style={styles.statNumber}>{stats.atendimentos}</Text>
                        <Text style={styles.statLabel}>Atendimentos</Text>
                    </View>
                </View>

                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: Colors.success }]}>
                        <Text style={styles.statValue}>{formatCurrency(stats.receitas)}</Text>
                        <Text style={styles.statLabel}>Receitas</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: Colors.error }]}>
                        <Text style={styles.statValue}>{formatCurrency(stats.despesas)}</Text>
                        <Text style={styles.statLabel}>Despesas</Text>
                    </View>
                </View>

                {/* Card de Saldo */}
                <View style={styles.saldoCard}>
                    <View style={styles.saldoHeader}>
                        <Feather name="trending-up" size={24} color={stats.receitas - stats.despesas >= 0 ? Colors.success : Colors.error} />
                        <Text style={styles.saldoTitle}>Saldo Total</Text>
                    </View>
                    <Text style={[
                        styles.saldoValue,
                        { color: stats.receitas - stats.despesas >= 0 ? Colors.success : Colors.error }
                    ]}>
                        {formatCurrency(stats.receitas - stats.despesas)}
                    </Text>
                    <Text style={styles.saldoSubtitle}>
                        {stats.receitas - stats.despesas >= 0 ? 'Lucro' : 'Prejuízo'}
                    </Text>
                </View>

                {/* Gráfico de Barras Simulado */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Resumo Financeiro</Text>
                    <View style={styles.chartContainer}>
                        {/* Barra de Receitas */}
                        <View style={styles.barContainer}>
                            <Text style={styles.barLabel}>Receitas</Text>
                            <View style={styles.barBackground}>
                                <View style={[
                                    styles.bar,
                                    {
                                        backgroundColor: Colors.success,
                                        width: `${Math.min((stats.receitas / (stats.receitas + stats.despesas || 1)) * 100, 100)}%`
                                    }
                                ]} />
                            </View>
                            <Text style={styles.barValue}>{formatCurrency(stats.receitas)}</Text>
                        </View>

                        {/* Barra de Despesas */}
                        <View style={styles.barContainer}>
                            <Text style={styles.barLabel}>Despesas</Text>
                            <View style={styles.barBackground}>
                                <View style={[
                                    styles.bar,
                                    {
                                        backgroundColor: Colors.error,
                                        width: `${Math.min((stats.despesas / (stats.receitas + stats.despesas || 1)) * 100, 100)}%`
                                    }
                                ]} />
                            </View>
                            <Text style={styles.barValue}>{formatCurrency(stats.despesas)}</Text>
                        </View>

                        {/* Barra de Saldo */}
                        <View style={styles.barContainer}>
                            <Text style={styles.barLabel}>Saldo</Text>
                            <View style={styles.barBackground}>
                                <View style={[
                                    styles.bar,
                                    {
                                        backgroundColor: stats.receitas - stats.despesas >= 0 ? Colors.primary : Colors.warning,
                                        width: `${Math.min(Math.abs(stats.receitas - stats.despesas) / (stats.receitas + stats.despesas || 1) * 100, 100)}%`
                                    }
                                ]} />
                            </View>
                            <Text style={styles.barValue}>{formatCurrency(stats.receitas - stats.despesas)}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Sidebar Modal */}
            <Modal
                visible={menuVisible}
                transparent={true}
                animationType="none"
                onRequestClose={toggleMenu}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.overlayTouch} onPress={toggleMenu} />
                    <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
                        <SafeAreaView style={styles.sidebarContent}>
                            <View style={styles.sidebarHeader}>
                                <Text style={styles.sidebarTitle}>Menu</Text>
                                <TouchableOpacity onPress={toggleMenu}>
                                    <Feather name="x" size={24} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.menuItems}>
                                {menuItems.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.menuItem}
                                        onPress={() => navigateTo(item.screen)}
                                    >
                                        <Feather name={item.icon as any} size={20} color={item.color} style={styles.itemIcon} />
                                        <Text style={styles.itemText}>{item.title}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View style={styles.sidebarFooter}>
                                <Text style={styles.footerText}>Versão 1.0.0</Text>
                            </View>
                        </SafeAreaView>
                    </Animated.View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingTop: 45,
    },
    menuButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    content: {
        flex: 1,
    },
    welcomeSection: {
        padding: 20,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    welcomeSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 15,
        gap: 15,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.textInverted,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textInverted,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textInverted,
        marginTop: 4,
        opacity: 0.9,
    },

    // Sidebar Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        flexDirection: 'row',
    },
    overlayTouch: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    sidebar: {
        width: 280,
        backgroundColor: Colors.surface,
        height: '100%',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    sidebarContent: {
        flex: 1,
    },
    sidebarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.background,
        marginTop: 20,
    },
    sidebarTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    menuItems: {
        flex: 1,
        paddingVertical: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    itemIcon: {
        marginRight: 15,
    },
    itemText: {
        fontSize: 16,
        color: Colors.textPrimary,
        fontWeight: '500',
    },
    sidebarFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: Colors.background,
        alignItems: 'center',
    },
    footerText: {
        color: Colors.textSecondary,
        fontSize: 12,
    },

    // Saldo Card Styles
    saldoCard: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 24,
        marginHorizontal: 20,
        marginTop: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    saldoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    saldoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginLeft: 10,
    },
    saldoValue: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    saldoSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
    },

    // Chart Card Styles
    chartCard: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 24,
        margin: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 20,
    },
    chartContainer: {
        gap: 16,
    },
    barContainer: {
        marginBottom: 12,
    },
    barLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    barBackground: {
        height: 12,
        backgroundColor: Colors.background,
        borderRadius: 6,
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
        borderRadius: 6,
    },
    barValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginTop: 6,
    },
});
