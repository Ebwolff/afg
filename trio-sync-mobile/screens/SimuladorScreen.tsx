import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    Keyboard,
} from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { Colors } from '../constants/Colors';
import { supabase } from '../lib/supabase';

export default function SimuladorScreen() {
    const [valorCredito, setValorCredito] = useState('');
    const [taxaAdm, setTaxaAdm] = useState('');
    const [prazo, setPrazo] = useState('');
    const [clienteNome, setClienteNome] = useState('');
    const [saving, setSaving] = useState(false);

    const [resultado, setResultado] = useState<{
        valorCredito: number;
        taxaAdm: number;
        prazo: number;
        valorTotal: number;
        valorParcela: number;
        valorTaxa: number;
        valorMeiaParcela: number;
    } | null>(null);

    const calcular = () => {
        const credito = parseFloat(valorCredito);
        const taxa = parseFloat(taxaAdm);
        const meses = parseInt(prazo);

        if (isNaN(credito) || isNaN(taxa) || isNaN(meses) || meses === 0) {
            Alert.alert('Erro', 'Preencha todos os campos corretamente.');
            return;
        }

        const valorTaxa = credito * (taxa / 100);
        const valorTotal = credito + valorTaxa;
        const valorParcela = valorTotal / meses;
        const valorMeiaParcela = valorParcela / 2;

        setResultado({
            valorCredito: credito,
            taxaAdm: taxa,
            prazo: meses,
            valorTotal,
            valorParcela,
            valorMeiaParcela,
            valorTaxa,
        });
        Keyboard.dismiss();
    };

    const limpar = () => {
        setValorCredito('');
        setTaxaAdm('');
        setPrazo('');
        setClienteNome('');
        setResultado(null);
    };

    const salvarSimulacao = async () => {
        if (!resultado) {
            Alert.alert('Erro', 'Calcule a simulação antes de salvar.');
            return;
        }

        if (!clienteNome.trim()) {
            Alert.alert('Erro', 'Informe o nome do cliente para salvar.');
            return;
        }

        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert('Erro', 'Você precisa estar logado para salvar.');
                return;
            }

            const { error } = await supabase.from('simulacoes_consorcio').insert({
                cliente_nome: clienteNome.trim(),
                tipo_bem: 'consorcio',
                valor_carta: resultado.valorCredito,
                prazo_meses: resultado.prazo,
                valor_parcela: resultado.valorParcela,
                taxa_administracao: resultado.taxaAdm,
                observacoes: null,
                created_by: user.id,
            });

            if (error) {
                console.error('Erro ao salvar:', error);
                Alert.alert('Erro', 'Não foi possível salvar a simulação.');
                return;
            }

            Alert.alert('Sucesso', 'Simulação salva e sincronizada com sucesso!');
        } catch (error) {
            console.error('Erro:', error);
            Alert.alert('Erro', 'Ocorreu um erro ao salvar.');
        } finally {
            setSaving(false);
        }
    };

    const gerarPDF = async () => {
        if (!resultado) return;

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
                            @page { margin: 0; size: A4; }
                            body { font-family: 'Helvetica', sans-serif; color: #333; margin: 0; padding: 20px; -webkit-print-color-adjust: exact; box-sizing: border-box; }
                            
                            /* Borda Verde ao redor de todo o conteúdo */
                            .main-border {
                                border: 4px solid #0f572d;
                                padding: 0;
                                min-height: 95vh;
                                position: relative;
                            }

                            /* Cores atualizadas para a paleta da logo (Verde) */
                            .header-bg { background-color: #0f572d; height: 15px; width: 100%; } 
                            
                            .container { padding: 40px 50px; }
                            
                            .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; }
                            .logo { width: 150px; height: auto; object-fit: contain; }
                            .company-info { text-align: right; font-size: 10px; color: #6b7280; }
                            
                            .title-section { text-align: center; margin-bottom: 40px; }
                            .main-title { font-size: 24px; font-weight: bold; color: #0f572d; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
                            .sub-title { font-size: 14px; color: #6b7280; font-weight: 300; }
                            
                            .card { background-color: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                            
                            .client-info { margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                            .client-name { font-size: 18px; font-weight: bold; color: #111827; }
                            .simulation-date { font-size: 12px; color: #6b7280; }
                            
                            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                            .row { margin-bottom: 15px; border-bottom: 1px dashed #e5e7eb; padding-bottom: 8px; }
                            .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; display: block; margin-bottom: 4px; }
                            .value { font-size: 16px; font-weight: bold; color: #374151; }
                            
                            /* Gradiente Verde */
                            .highlight-box { background: linear-gradient(135deg, #0f572d 0%, #0da54b 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-top: 20px; box-shadow: 0 10px 15px -3px rgba(15, 87, 45, 0.3); }
                            .highlight-label { font-size: 14px; opacity: 0.9; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
                            .highlight-value { font-size: 42px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                            
                            .half-install-box { margin-top: 15px; background-color: #f0fdf4; border: 1px solid #0f572d; color: #0f572d; padding: 15px; border-radius: 8px; text-align: center; }
                            .half-install-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
                            .half-install-value { font-size: 24px; font-weight: 800; margin-top: 5px; }

                            .conditions { font-size: 10px; opacity: 0.8; margin-top: 10px; color: white; }
                            
                            .footer { position: absolute; bottom: 0; left: 0; right: 0; background-color: #f9fafb; padding: 30px 50px; text-align: center; border-top: 1px solid #e5e7eb; }
                            .disclaimer { font-size: 10px; color: #9ca3af; margin-bottom: 20px; line-height: 1.5; text-align: justify; }
                            
                            .contact-info { display: flex; justify-content: center; gap: 40px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb; }
                            .contact-item { display: flex; flex-direction: column; align-items: center; }
                            .contact-label { font-size: 10px; color: #6b7280; margin-bottom: 2px; font-weight: 600; text-transform: uppercase; }
                            .contact-value { font-size: 14px; color: #0f572d; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <div class="main-border">
                            <div class="header-bg"></div>
                            
                            <div class="container">
                                <div class="header">
                                    <img src="data:image/jpeg;base64,${logoBase64}" class="logo" />
                                    <div class="company-info">
                                        <strong>AFG Soluções Financeiras</strong><br/>
                                        Planejamento e Consultoria
                                    </div>
                                </div>

                                <div class="title-section">
                                    <div class="main-title">Simulação de Consórcio</div>
                                    <div class="sub-title">Planejamento financeiro personalizado para sua conquista</div>
                                </div>

                                <div class="card">
                                    <div class="client-info">
                                        <div class="client-name">${clienteNome || 'Cliente Preferencial'}</div>
                                        <div class="simulation-date">Data: ${new Date().toLocaleDateString('pt-BR')}</div>
                                    </div>

                                    <div class="grid">
                                        <div class="row">
                                            <span class="label">Valor do Crédito</span>
                                            <span class="value">R$ ${resultado.valorCredito.toFixed(2)}</span>
                                        </div>
                                        <div class="row">
                                            <span class="label">Prazo do Plano</span>
                                            <span class="value">${resultado.prazo} meses</span>
                                        </div>
                                        <div class="row">
                                            <span class="label">Taxa Administrativa</span>
                                            <span class="value">${resultado.taxaAdm}%</span>
                                        </div>
                                        <div class="row">
                                            <span class="label">Custo Administrativo</span>
                                            <span class="value">R$ ${resultado.valorTaxa.toFixed(2)}</span>
                                        </div>
                                        <div class="row" style="grid-column: span 2; border-bottom: none;">
                                            <span class="label">Valor Total do Plano</span>
                                            <span class="value">R$ ${resultado.valorTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="highlight-box">
                                    <div class="highlight-label">Parcela Cheia</div>
                                    <div class="highlight-value">R$ ${resultado.valorParcela.toFixed(2)}</div>
                                    <div class="conditions">*Valores sujeitos a alteração sem aviso prévio. Consulte condições.</div>
                                </div>

                                <div class="half-install-box">
                                    <div class="half-install-label">Opção de Meia Parcela (até a contemplação)</div>
                                    <div class="half-install-value">R$ ${resultado.valorMeiaParcela.toFixed(2)}</div>
                                </div>
                            </div>

                            <div class="footer">
                                <div class="disclaimer">
                                    Esta simulação é de caráter meramente informativo e não constitui obrigação de negócio. Os valores apresentados são estimados e podem sofrer variações de acordo com a tabela vigente na data da contratação. A aprovação do crédito está sujeita à análise. O prazo e as condições de pagamento estão em conformidade com as normas do sistema de consórcios. A Opção de Meia Parcela está sujeita às regras do grupo e administradora.
                                </div>
                                
                                <div class="contact-info">
                                    <div class="contact-item">
                                        <span class="contact-label">Instagram</span>
                                        <span class="contact-value">@afg_solucoesfinanceiras</span>
                                    </div>
                                    <div class="contact-item">
                                        <span class="contact-label">Telefone / WhatsApp</span>
                                        <span class="contact-value">+55 99 99168-5741</span>
                                    </div>
                                </div>
                                <div class="contact-info" style="margin-top: 10px; border-top: none; padding-top: 0;">
                                    <div class="contact-item">
                                        <span class="contact-label">Endereço</span>
                                        <span class="contact-value" style="font-size: 10px;">Rua Bom Jesus, nº 309, Centro, Balsas - MA</span>
                                    </div>
                                    <div class="contact-item">
                                        <span class="contact-label">Email</span>
                                        <span class="contact-value" style="font-size: 10px;">aafgsolucoesfinanceiras@gmail.com</span>
                                    </div>
                                </div>
                            </div>
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

    return (
        <ScrollView style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Dados da Simulação</Text>

                <Input
                    label="Valor do Crédito (R$)"
                    placeholder="Ex: 50000.00"
                    value={valorCredito}
                    onChangeText={setValorCredito}
                    keyboardType="decimal-pad"
                />

                <Input
                    label="Taxa Administrativa Total (%)"
                    placeholder="Ex: 15"
                    value={taxaAdm}
                    onChangeText={setTaxaAdm}
                    keyboardType="decimal-pad"
                />

                <Input
                    label="Prazo (meses)"
                    placeholder="Ex: 60"
                    value={prazo}
                    onChangeText={setPrazo}
                    keyboardType="numeric"
                />

                <View style={styles.buttonRow}>
                    <Button
                        title="Limpar"
                        onPress={limpar}
                        variant="secondary"
                        style={{ flex: 1 }}
                    />
                    <Button
                        title="Calcular"
                        onPress={calcular}
                        style={{ flex: 1 }}
                    />
                </View>
            </View>

            {resultado && (
                <View style={styles.resultContainer}>
                    <Text style={styles.resultTitle}>Resultado da Simulação</Text>

                    <View style={styles.saveCard}>
                        <Input
                            label="Nome do Cliente (para salvar)"
                            placeholder="Ex: João Silva"
                            value={clienteNome}
                            onChangeText={setClienteNome}
                        />
                    </View>

                    <View style={styles.resultCard}>
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Valor do Crédito:</Text>
                            <Text style={styles.resultValue}>R$ {resultado.valorCredito.toFixed(2)}</Text>
                        </View>
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Taxa Adm. ({resultado.taxaAdm}%):</Text>
                            <Text style={styles.resultValue}>R$ {resultado.valorTaxa.toFixed(2)}</Text>
                        </View>
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Valor Total:</Text>
                            <Text style={styles.resultValue}>R$ {resultado.valorTotal.toFixed(2)}</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.highlightRow}>
                            <Text style={styles.highlightLabel}>Parcela Mensal ({resultado.prazo}x)</Text>
                            <Text style={styles.highlightValue}>R$ {resultado.valorParcela.toFixed(2)}</Text>
                        </View>

                        <View style={[styles.highlightRow, { marginTop: 15 }]}>
                            <Text style={[styles.highlightLabel, { fontSize: 14 }]}>Meia Parcela (até contemplação)</Text>
                            <Text style={[styles.highlightValue, { fontSize: 24, color: '#0f572d' }]}>R$ {resultado.valorMeiaParcela.toFixed(2)}</Text>
                        </View>
                    </View>

                    <Button
                        title={saving ? 'Salvando...' : 'Salvar Simulação'}
                        onPress={salvarSimulacao}
                        disabled={saving}
                        style={styles.saveButton}
                    />

                    <Button
                        title="Exportar Simulação em PDF"
                        onPress={gerarPDF}
                        variant="outline"
                        style={styles.exportButton}
                    />
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: 16,
    },
    card: {
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 20,
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    resultContainer: {
        marginBottom: 40,
    },
    resultTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 16,
        textAlign: 'center',
    },
    resultCard: {
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        marginBottom: 16,
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    resultLabel: {
        fontSize: 16,
        color: '#4b5563',
    },
    resultValue: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 16,
    },
    highlightRow: {
        alignItems: 'center',
    },
    highlightLabel: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    highlightValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    exportButton: {
        marginTop: 8,
    },
    saveCard: {
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    saveButton: {
        marginTop: 16,
    },
});
