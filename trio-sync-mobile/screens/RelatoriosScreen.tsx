import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { Button } from '../components/Button';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { Colors } from '../constants/Colors';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/formatters';

export default function RelatoriosScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        receitas: 0,
        despesas: 0,
        saldo: 0,
        clientes: 0,
        atendimentos: 0,
        atendimentosPendentes: 0,
        atendimentosConcluidos: 0,
    });

    const loadStats = async () => {
        try {
            // Fetch Transações
            const { data: transacoes, error: transError } = await supabase
                .from('transacoes')
                .select('*');

            if (transError) throw transError;

            // Fetch Clientes (count)
            const { count: clientesCount, error: clientesError } = await supabase
                .from('clientes')
                .select('*', { count: 'exact', head: true });

            if (clientesError) throw clientesError;

            // Fetch Atendimentos
            const { data: atendimentos, error: atendError } = await supabase
                .from('atendimentos')
                .select('*');

            if (atendError) throw atendError;

            // Calculate Stats
            const receitas = (transacoes || [])
                .filter((t: any) => t.tipo === 'receita')
                .reduce((acc: number, t: any) => acc + (t.valor || 0), 0);

            const despesas = (transacoes || [])
                .filter((t: any) => t.tipo === 'despesa')
                .reduce((acc: number, t: any) => acc + (t.valor || 0), 0);

            const atendimentosPendentes = (atendimentos || []).filter((a: any) => a.status === 'aguardando' || a.status === 'em_andamento').length;
            const atendimentosConcluidos = (atendimentos || []).filter((a: any) => a.status === 'concluido').length;

            console.log('Relatórios Stats:', { receitas, despesas, clientesCount, atendimentos: atendimentos?.length });

            setStats({
                receitas,
                despesas,
                saldo: receitas - despesas,
                clientes: clientesCount || 0,
                atendimentos: (atendimentos || []).length,
                atendimentosPendentes,
                atendimentosConcluidos,
            });

        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
            Alert.alert('Erro', 'Falha ao carregar relatórios');
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

    const generatePDF = async () => {
        try {
            // Load logo
            const asset = Asset.fromModule(require('../assets/logo.jpg'));
            await asset.downloadAsync();
            const logoBase64 = await FileSystem.readAsStringAsync(asset.localUri!, {
                encoding: 'base64',
            });

            const html = `
                <html>
                    <head>
                        <style>
                            body { font-family: 'Helvetica', sans-serif; padding: 20px; }
                            .header { text-align: center; margin-bottom: 30px; }
                            .logo { width: 150px; height: auto; margin-bottom: 10px; }
                            .title { font-size: 24px; font-weight: bold; color: #333; }
                            .date { color: #666; margin-top: 5px; }
                            .section { margin-bottom: 30px; }
                            .section-title { font-size: 18px; font-weight: bold; color: ${Colors.primary}; border-bottom: 2px solid ${Colors.primary}; padding-bottom: 5px; margin-bottom: 15px; }
                            .card-container { display: flex; flex-wrap: wrap; gap: 15px; }
                            .card { flex: 1; min-width: 200px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9; }
                            .card-label { font-size: 14px; color: #666; }
                            .card-value { font-size: 20px; font-weight: bold; color: #333; margin-top: 5px; }
                            .receita { color: ${Colors.success}; }
                            .despesa { color: ${Colors.error}; }
                            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #999; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <img src="data:image/jpeg;base64,${logoBase64}" class="logo" />
                            <div class="title">Relatório Gerencial</div>
                            <div class="date">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
                        </div>

                        <div class="section">
                            <div class="section-title">Financeiro</div>
                            <div class="card-container">
                                <div class="card">
                                    <div class="card-label">Receitas Totais</div>
                                    <div class="card-value receita">${formatCurrency(stats.receitas)}</div>
                                </div>
                                <div class="card">
                                    <div class="card-label">Despesas Totais</div>
                                    <div class="card-value despesa">${formatCurrency(stats.despesas)}</div>
                                </div>
                                <div class="card">
                                    <div class="card-label">Saldo Líquido</div>
                                    <div class="card-value" style="color: ${stats.saldo >= 0 ? Colors.success : Colors.error}">
                                        ${formatCurrency(stats.saldo)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="section">
                            <div class="section-title">Operacional</div>
                            <div class="card-container">
                                <div class="card">
                                    <div class="card-label">Total de Clientes</div>
                                    <div class="card-value">${stats.clientes}</div>
                                </div>
                                <div class="card">
                                    <div class="card-label">Total de Atendimentos</div>
                                    <div class="card-value">${stats.atendimentos}</div>
                                </div>
                            </div>
                        </div>

                        <div class="section">
                            <div class="section-title">Status dos Atendimentos</div>
                            <div class="card-container">
                                <div class="card">
                                    <div class="card-label">Concluídos</div>
                                    <div class="card-value receita">${stats.atendimentosConcluidos}</div>
                                </div>
                                <div class="card">
                                    <div class="card-label">Pendentes/Em Andamento</div>
                                    <div class="card-value despesa">${stats.atendimentosPendentes}</div>
                                </div>
                            </div>
                        </div>

                        <div class="footer">
                            AFG Soluções Financeiras - Documento Confidencial
                        </div>
                    </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível gerar o PDF');
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
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Visão Geral</Text>
                <Button
                    title="Exportar PDF"
                    onPress={generatePDF}
                    style={styles.exportButton}
                    variant="outline"
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Financeiro</Text>
                <View style={styles.row}>
                    <View style={[styles.card, { borderLeftColor: Colors.success }]}>
                        <Text style={styles.cardLabel}>Receitas</Text>
                        <Text style={[styles.cardValue, { color: Colors.success }]}>
                            {formatCurrency(stats.receitas)}
                        </Text>
                    </View>
                    <View style={[styles.card, { borderLeftColor: Colors.error }]}>
                        <Text style={styles.cardLabel}>Despesas</Text>
                        <Text style={[styles.cardValue, { color: Colors.error }]}>
                            {formatCurrency(stats.despesas)}
                        </Text>
                    </View>
                </View>
                <View style={[styles.card, { borderLeftColor: stats.saldo >= 0 ? Colors.success : Colors.error, marginTop: 12 }]}>
                    <Text style={styles.cardLabel}>Saldo Total</Text>
                    <Text style={[styles.cardValue, { color: stats.saldo >= 0 ? Colors.success : Colors.error }]}>
                        {formatCurrency(stats.saldo)}
                    </Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Operacional</Text>
                <View style={styles.row}>
                    <View style={[styles.card, { borderLeftColor: Colors.info }]}>
                        <Text style={styles.cardLabel}>Clientes Totais</Text>
                        <Text style={styles.cardValue}>{stats.clientes}</Text>
                    </View>
                    <View style={[styles.card, { borderLeftColor: '#8b5cf6' }]}>
                        <Text style={styles.cardLabel}>Atendimentos</Text>
                        <Text style={styles.cardValue}>{stats.atendimentos}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Atendimentos</Text>
                <View style={styles.progressBarContainer}>
                    <View style={styles.progressLabelRow}>
                        <Text style={styles.progressLabel}>Concluídos</Text>
                        <Text style={styles.progressValue}>{stats.atendimentosConcluidos}</Text>
                    </View>
                    <View style={styles.progressBarBackground}>
                        <View
                            style={[
                                styles.progressBarFill,
                                {
                                    width: `${stats.atendimentos > 0 ? (stats.atendimentosConcluidos / stats.atendimentos) * 100 : 0}%`,
                                    backgroundColor: Colors.success
                                }
                            ]}
                        />
                    </View>
                </View>

                <View style={styles.progressBarContainer}>
                    <View style={styles.progressLabelRow}>
                        <Text style={styles.progressLabel}>Pendentes</Text>
                        <Text style={styles.progressValue}>{stats.atendimentosPendentes}</Text>
                    </View>
                    <View style={styles.progressBarBackground}>
                        <View
                            style={[
                                styles.progressBarFill,
                                {
                                    width: `${stats.atendimentos > 0 ? (stats.atendimentosPendentes / stats.atendimentos) * 100 : 0}%`,
                                    backgroundColor: Colors.warning
                                }
                            ]}
                        />
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: 16,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    exportButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    card: {
        flex: 1,
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 16,
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    cardLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    cardValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    progressBarContainer: {
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        elevation: 1,
    },
    progressLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 14,
        color: '#4b5563',
        fontWeight: '500',
    },
    progressValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    progressBarBackground: {
        height: 8,
        backgroundColor: Colors.border,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
});
