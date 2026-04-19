import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, TextInput, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

// Utilitário para acessar o Electron de forma segura sem quebrar o Metro/Expo
const getIpcRenderer = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).require) {
        try {
        } catch (e) {
            return null;
        }
    }
    return null;
};

const theme = {
    bgCardBlue: '#151A30',
    bgCardForm: '#1A2035',
    inputBg: '#0F131F',
    textPrimary: '#FFFFFF',
    textSecondary: '#A0A4B8',
    border: '#2A2F45',
    mixStart: '#00C6FF',
    mixEnd: '#22C55E',
    bgGradientStart: '#0B132B',
    bgGradientEnd: '#1C3A63',
};

const GradientBorderWrapper = ({ children, flexValue = 1 }: any) => (
    <LinearGradient
        colors={[theme.mixStart, theme.mixEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ flex: flexValue, padding: 1.5, borderRadius: 16, elevation: 5 }}
    >
        {children}
    </LinearGradient>
);

export default function Dashboard() {
    const [listaNotas, setListaNotas] = useState<any[]>([]);
    const [valorTotalFaturado, setValorTotalFaturado] = useState(0);
    const [notasDoMes, setNotasDoMes] = useState(0);
    const [quickNome, setQuickNome] = useState('');
    const [quickValor, setQuickValor] = useState('');
    const [notaEmEdicao, setNotaEmEdicao] = useState<any>(null);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const ITENS_POR_PAGINA = 5;

    const ipcRenderer = getIpcRenderer();

    const sincronizarComElectron = (novaLista: any[]) => {
        if (ipcRenderer) {
            ipcRenderer.send('salvar-notas', novaLista);
        }
    };

    const carregarNotas = async () => {
        try {
            let notas: any[] = [];

            // Tenta ler do Electron (Arquivo PC)
            if (ipcRenderer) {
                const notasDoArquivo = ipcRenderer.sendSync('ler-notas');
                notas = Array.isArray(notasDoArquivo) ? notasDoArquivo : [];
            } else {
                // Fallback para AsyncStorage (Web/Browser)
                const notasSalvas = await AsyncStorage.getItem('@nfone_notas');
                notas = notasSalvas ? (Array.isArray(JSON.parse(notasSalvas)) ? JSON.parse(notasSalvas) : []) : [];
            }

            setListaNotas(notas);

            let total = 0;
            let qtdMesAtual = 0;
            const mesAtual = new Date().getMonth() + 1;
            const anoAtual = new Date().getFullYear();

            notas.forEach((nota: any) => {
                // Correção: Remove "R$" e espaços se existirem antes de converter
                const valorLimpo = String(nota.valor).replace('R$', '').replace(/\s/g, '').replace(',', '.');
                const valorNumerico = parseFloat(valorLimpo);

                if (!isNaN(valorNumerico)) {
                    total += valorNumerico;
                }

                const partesData = nota.data?.split('/');
                if (partesData && partesData.length >= 2) {
                    const mesNota = parseInt(partesData[1]);
                    const anoNota = parseInt(partesData[2] || String(anoAtual));
                    if (mesNota === mesAtual && anoNota === anoAtual) qtdMesAtual++;
                }
            });

            setValorTotalFaturado(total);
            setNotasDoMes(qtdMesAtual);
        } catch (error) {
            console.error("Erro ao carregar notas:", error);
            setListaNotas([]); // Evita que listaNotas fique undefined
        }
    };

    const removerNota = async (idParaRemover: string) => {
        const confirmacao = Platform.OS === 'web' ? window.confirm("Excluir esta nota?") : true;
        if (!confirmacao) return;

        try {
            const novaLista = listaNotas.filter((nota) => nota.id !== idParaRemover);
            await AsyncStorage.setItem('@nfone_notas', JSON.stringify(novaLista));
            sincronizarComElectron(novaLista);
            carregarNotas();
        } catch (error) { console.error(error); }
    };

    const salvarEdicao = async () => {
        try {
            const notasAtualizadas = listaNotas.map((nota) => nota.id === notaEmEdicao.id ? notaEmEdicao : nota);
            await AsyncStorage.setItem('@nfone_notas', JSON.stringify(notasAtualizadas));
            sincronizarComElectron(notasAtualizadas);
            setNotaEmEdicao(null);
            carregarNotas();
        } catch (error) { console.error(error); }
    };

    const gerarNotaRapida = async () => {
        if (!quickNome || !quickValor) return;
        try {
            const dataAtual = new Date().toLocaleDateString('pt-BR');
            const totalNotasAgora = listaNotas.length + 1;
            const numNota = `#${totalNotasAgora.toString().padStart(3, '0')}`;

            const html = `<html><body style="font-family: Arial; padding: 40px;"><h1 style="color: #22C55E;">WSE - Recibo Rápido</h1><p>Emissão: ${dataAtual} | Nota: ${numNota}</p><hr/><p><b>Cliente:</b> ${quickNome}</p><h2>Valor Total: R$ ${quickValor}</h2></body></html>`;

            const novaNota = { id: Date.now().toString(), numero: numNota, cliente: quickNome, data: dataAtual, valor: quickValor };
            const novaLista = [novaNota, ...listaNotas];

            await AsyncStorage.setItem('@nfone_notas', JSON.stringify(novaLista));
            sincronizarComElectron(novaLista);

            await carregarNotas();
            setQuickNome(''); setQuickValor('');
            setPaginaAtual(1);
            await Print.printAsync({ html });
        } catch (error) { console.error(error); }
    };

    useEffect(() => { carregarNotas(); }, []);

    const calcBarWidth = (val: number): any => {
        if (val === 0) return '5%';
        const maxValue = Math.max(valorTotalFaturado, listaNotas.length, 100);
        const percentage = (val / maxValue) * 100;
        return `${Math.min(Math.max(percentage, 8), 100)}%`;
    };

    const indexUltimoItem = paginaAtual * ITENS_POR_PAGINA;
    const indexPrimeiroItem = indexUltimoItem - ITENS_POR_PAGINA;
    const notasDaPagina = listaNotas.slice(indexPrimeiroItem, indexUltimoItem);
    const totalPaginas = Math.ceil(listaNotas.length / ITENS_POR_PAGINA);

    return (
        <LinearGradient colors={[theme.bgGradientStart, theme.bgGradientEnd]} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 40, paddingBottom: 40, paddingTop: 30 }}>

                <View style={{ marginBottom: 30 }}>
                    <Text style={{ fontSize: 26, color: '#FFF' }}>Painel de Controle <Text style={{ color: theme.mixEnd, fontWeight: 'bold' }}>WSE</Text></Text>
                </View>

                <View style={styles.dashboardCards}>
                    <GradientBorderWrapper><View style={styles.cardInfo}><Text style={styles.cardLabel}>Histórico Total</Text><Text style={styles.cardValue}>{listaNotas.length}</Text></View></GradientBorderWrapper>
                    <GradientBorderWrapper><View style={styles.cardInfo}><Text style={styles.cardLabel}>Notas do Mês</Text><Text style={styles.cardValue}>{notasDoMes}</Text></View></GradientBorderWrapper>
                    <GradientBorderWrapper flexValue={1.5}><View style={styles.cardInfo}><Text style={styles.cardLabel}>Faturamento</Text><Text style={styles.cardValue}><Text style={{ fontSize: 20, fontWeight: 'normal' }}>R$ </Text>{valorTotalFaturado.toFixed(2).replace('.', ',')}</Text></View></GradientBorderWrapper>
                </View>

                <View style={styles.splitLayout}>
                    <View style={{ flex: 1.8 }}>
                        <GradientBorderWrapper>
                            <View style={styles.chartSection}>
                                <Text style={styles.sectionTitle}>Visão Geral</Text>
                                {[
                                    { label: 'Faturamento', val: valorTotalFaturado },
                                    { label: 'Notas/Mês', val: notasDoMes },
                                    { label: 'Total Notas', val: listaNotas.length }
                                ].map((item, idx) => (
                                    <View key={idx} style={styles.chartRow}>
                                        <Text style={styles.chartYLabel}>{item.label}</Text>
                                        <View style={styles.chartTrack}>
                                            <LinearGradient colors={[theme.mixStart, theme.mixEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.chartBar, { width: calcBarWidth(item.val) }]} />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </GradientBorderWrapper>

                        <View style={{ height: 20 }} />

                        <GradientBorderWrapper>
                            <View style={styles.tableSection}>
                                <Text style={styles.sectionTitle}>Histórico de Notas</Text>
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>Nº</Text>
                                    <Text style={[styles.tableHeaderText, { flex: 2 }]}>Cliente</Text>
                                    <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Emissão</Text>
                                    <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Valor</Text>
                                    <Text style={[styles.tableHeaderText, { width: 70, textAlign: 'center', marginLeft: 15 }]}>Ações</Text>
                                </View>

                                {notasDaPagina.map((nota: any, index: number) => {
                                    const numDinamico = listaNotas.length - (indexPrimeiroItem + index);
                                    return (
                                        <View key={nota.id} style={styles.tableRow}>
                                            <Text style={{ flex: 0.8, color: theme.mixEnd, fontWeight: 'bold' }}>#{numDinamico.toString().padStart(3, '0')}</Text>
                                            <Text style={{ flex: 2, color: theme.textPrimary }} numberOfLines={1}>{nota.cliente}</Text>
                                            <Text style={{ flex: 1.2, color: theme.textSecondary }}>{nota.data}</Text>
                                            <Text style={{ flex: 1, textAlign: 'right', color: theme.textSecondary }}>R$ {nota.valor}</Text>
                                            <View style={styles.actions}>
                                                <TouchableOpacity onPress={() => setNotaEmEdicao(nota)}><Feather name="edit" size={16} color={theme.mixStart} /></TouchableOpacity>
                                                <TouchableOpacity onPress={() => removerNota(nota.id)}><Feather name="trash-2" size={16} color="#EF4444" /></TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })}

                                {totalPaginas > 1 && (
                                    <View style={styles.paginationContainer}>
                                        <TouchableOpacity onPress={() => setPaginaAtual(p => Math.max(p - 1, 1))} disabled={paginaAtual === 1}>
                                            <Feather name="chevron-left" size={20} color={paginaAtual === 1 ? "#444" : "#FFF"} />
                                        </TouchableOpacity>
                                        <Text style={{ color: '#FFF' }}>{paginaAtual} de {totalPaginas}</Text>
                                        <TouchableOpacity onPress={() => setPaginaAtual(p => Math.min(p + 1, totalPaginas))} disabled={paginaAtual === totalPaginas}>
                                            <Feather name="chevron-right" size={20} color={paginaAtual === totalPaginas ? "#444" : "#FFF"} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </GradientBorderWrapper>
                    </View>

                    <View style={{ flex: 1 }}>
                        <GradientBorderWrapper>
                            <View style={styles.quickFormSection}>
                                <Text style={styles.quickTitle}>Novo Registro</Text>
                                <TextInput style={styles.formInput} placeholder="Nome do Cliente" placeholderTextColor={theme.textSecondary} value={quickNome} onChangeText={setQuickNome} />
                                <TextInput style={styles.formInput} placeholder="Valor Total (R$)" keyboardType="numeric" placeholderTextColor={theme.textSecondary} value={quickValor} onChangeText={(t) => setQuickValor(t.replace(/[^0-9,]/g, ''))} />
                                <TouchableOpacity onPress={gerarNotaRapida}>
                                    <LinearGradient colors={[theme.mixStart, theme.mixEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGerarNota}>
                                        <Text style={{ color: '#000', fontWeight: 'bold' }}>Gerar Nota</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </GradientBorderWrapper>
                    </View>
                </View>
            </ScrollView>

            {notaEmEdicao && (
                <Modal transparent visible animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: theme.bgCardBlue, borderColor: theme.mixStart, borderWidth: 1 }]}>
                            <Text style={styles.modalTitle}>Editar Registro</Text>
                            <TextInput style={styles.formInput} value={notaEmEdicao.cliente} onChangeText={(t) => setNotaEmEdicao({ ...notaEmEdicao, cliente: t })} />
                            <TextInput style={styles.formInput} value={notaEmEdicao.valor} onChangeText={(t) => setNotaEmEdicao({ ...notaEmEdicao, valor: t.replace(/[^0-9,]/g, '') })} />
                            <View style={styles.modalActions}>
                                <TouchableOpacity onPress={() => setNotaEmEdicao(null)}><Text style={{ color: '#FFF', marginRight: 20 }}>Cancelar</Text></TouchableOpacity>
                                <TouchableOpacity onPress={salvarEdicao}><Text style={{ color: theme.mixEnd, fontWeight: 'bold' }}>Salvar</Text></TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    dashboardCards: { flexDirection: 'row', gap: 20, marginBottom: 30 },
    cardInfo: { flex: 1, padding: 25, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bgCardBlue },
    cardLabel: { fontSize: 14, color: '#A0A4B8', marginBottom: 10 },
    cardValue: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
    splitLayout: { flexDirection: 'row', gap: 20 },
    chartSection: { borderRadius: 15, padding: 25, flex: 1, backgroundColor: theme.bgCardBlue },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 20, color: '#FFF' },
    chartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    chartYLabel: { width: 80, color: '#A0A4B8', fontSize: 12, fontWeight: 'bold' },
    chartTrack: { flex: 1, height: 25, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4 },
    chartBar: { height: 25, borderRadius: 4 },
    tableSection: { borderRadius: 15, padding: 25, flex: 1, backgroundColor: theme.bgCardBlue },
    tableHeader: { flexDirection: 'row', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: theme.border },
    tableHeaderText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', paddingVertical: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    actions: { width: 70, flexDirection: 'row', justifyContent: 'center', gap: 15, marginLeft: 15 },
    quickFormSection: { borderRadius: 15, padding: 30, backgroundColor: theme.bgCardForm },
    quickTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 25 },
    formInput: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 12, marginBottom: 15, color: '#FFF', backgroundColor: theme.inputBg },
    btnGerarNota: { padding: 15, borderRadius: 8, alignItems: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: 400, padding: 35, borderRadius: 16 },
    modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 25, color: '#FFF' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 25 },
    paginationContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, gap: 15 }
});