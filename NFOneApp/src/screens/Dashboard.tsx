import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, TextInput, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

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
        style={{ flex: flexValue, padding: 1.5, borderRadius: 16, shadowColor: theme.mixStart, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 }}
    >
        {children}
    </LinearGradient>
);

export default function Dashboard() {
    const [listaNotas, setListaNotas] = useState<any[]>([]);
    const [valorTotalFaturado, setValorTotalFaturado] = useState(0);
    const [notasDoMes, setNotasDoMes] = useState(0);

    const [quickNome, setQuickNome] = useState('');
    const [quickCnpj, setQuickCnpj] = useState('');
    const [quickPagamento, setQuickPagamento] = useState('PIX');
    const [quickValor, setQuickValor] = useState('');
    const [notaEmEdicao, setNotaEmEdicao] = useState<any>(null);

    // ESTADOS PARA PAGINAÇÃO
    const [paginaAtual, setPaginaAtual] = useState(1);
    const ITENS_POR_PAGINA = 5;

    const carregarNotas = async () => {
        try {
            const notasSalvas = await AsyncStorage.getItem('@nfone_notas');
            if (notasSalvas) {
                const notas = JSON.parse(notasSalvas);
                setListaNotas(notas);

                let total = 0;
                let qtdMesAtual = 0;
                const mesAtual = new Date().getMonth() + 1;
                const anoAtual = new Date().getFullYear();

                notas.forEach((nota: any) => {
                    const valorNumerico = parseFloat(String(nota.valor).replace(',', '.'));
                    if (!isNaN(valorNumerico)) total += valorNumerico;

                    const partesData = nota.data.split('/');
                    if (partesData.length >= 2) {
                        const mesNota = parseInt(partesData[1]);
                        const anoNota = parseInt(partesData[2] || String(anoAtual));
                        if (mesNota === mesAtual && anoNota === anoAtual) qtdMesAtual++;
                    } else { qtdMesAtual++; }
                });

                setValorTotalFaturado(total);
                setNotasDoMes(qtdMesAtual);
            }
        } catch (error) { console.error("Erro ao buscar notas:", error); }
    };

    // Ajusta a página atual caso a última nota da página seja apagada
    useEffect(() => {
        const totalPaginas = Math.ceil(listaNotas.length / ITENS_POR_PAGINA);
        if (paginaAtual > totalPaginas && totalPaginas > 0) {
            setPaginaAtual(totalPaginas);
        }
    }, [listaNotas.length]);

    const removerNota = async (idParaRemover: string) => {
        if (Platform.OS === 'web' && !window.confirm("Tem certeza que deseja excluir esta nota?")) return;
        try {
            const novaLista = listaNotas.filter((nota) => nota.id !== idParaRemover);
            await AsyncStorage.setItem('@nfone_notas', JSON.stringify(novaLista));
            carregarNotas();
        } catch (error) { console.error(error); }
    };

    const salvarEdicao = async () => {
        try {
            const notasAtualizadas = listaNotas.map((nota) => nota.id === notaEmEdicao.id ? notaEmEdicao : nota);
            await AsyncStorage.setItem('@nfone_notas', JSON.stringify(notasAtualizadas));
            setNotaEmEdicao(null);
            await carregarNotas();
            if (Platform.OS === 'web') setTimeout(() => alert("Nota atualizada com sucesso!"), 100);
        } catch (error) { console.error(error); }
    };

    const gerarNotaRapida = async () => {
        if (!quickNome || !quickValor) return alert("Preencha Nome e Valor.");
        try {
            const notasSalvas = await AsyncStorage.getItem('@nfone_notas');
            const notasArray = notasSalvas ? JSON.parse(notasSalvas) : [];
            let proxNumero = 1;
            if (notasArray.length > 0) {
                const ultimoNumero = parseInt(notasArray[0].numero.replace('#', ''), 10);
                if (!isNaN(ultimoNumero)) proxNumero = ultimoNumero + 1;
            }
            const numNota = `#${proxNumero.toString().padStart(4, '0')}`;
            const dataAtual = new Date().toLocaleDateString('pt-BR');
            const html = `<html><body style="font-family: Arial; padding: 40px; color: #333;"><h1 style="color: #22C55E;">NFONE - Recibo</h1><p>Emissão: ${dataAtual} | Nota: ${numNota}</p><hr/><p><b>Cliente:</b> ${quickNome}</p><p><b>CPF/CNPJ:</b> ${quickCnpj || '-'}</p><p><b>Pagamento:</b> ${quickPagamento}</p><h2 style="color: #22C55E;">Valor Total: R$ ${quickValor}</h2></body></html>`;

            const novaNota = { id: Date.now().toString(), numero: numNota, cliente: quickNome, data: dataAtual, valor: quickValor, pagamento: quickPagamento };
            notasArray.unshift(novaNota);
            await AsyncStorage.setItem('@nfone_notas', JSON.stringify(notasArray));
            await carregarNotas();

            setQuickNome(''); setQuickCnpj(''); setQuickValor(''); setQuickPagamento('PIX');
            setPaginaAtual(1); // Volta para a primeira página para ver a nova nota

            if (Platform.OS === 'web') {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();
                    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
                }
            } else { await Print.printAsync({ html }); }
        } catch (error) { console.error(error); }
    };

    useEffect(() => { carregarNotas(); }, []);

    const calcBarWidth = (val: number): any => {
        if (val === 0) return '0%';
        const maxValue = Math.max(valorTotalFaturado, listaNotas.length, 10);
        let percentage = (Math.log10(val + 1) / Math.log10(maxValue + 1)) * 100;
        return `${Math.min(Math.max(percentage, 5), 100)}%`;
    };

    // LÓGICA MATEMÁTICA DA PAGINAÇÃO
    const indexUltimoItem = paginaAtual * ITENS_POR_PAGINA;
    const indexPrimeiroItem = indexUltimoItem - ITENS_POR_PAGINA;
    const notasDaPagina = listaNotas.slice(indexPrimeiroItem, indexUltimoItem);
    const totalPaginas = Math.ceil(listaNotas.length / ITENS_POR_PAGINA);

    return (
        <LinearGradient colors={[theme.bgGradientStart, theme.bgGradientEnd]} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 40, paddingBottom: 40, paddingTop: 30 }}>
                <View style={{ marginBottom: 30 }}>
                    <Text style={{ fontSize: 26, color: '#FFF' }}>Bem-Vindo, <Text style={{ color: theme.mixEnd, fontWeight: 'bold' }}>Ágatha</Text>!</Text>
                </View>

                <View style={styles.dashboardCards}>
                    <GradientBorderWrapper><View style={styles.cardInfo}><Text style={styles.cardLabel}>Total de notas</Text><Text style={styles.cardValue}>{listaNotas.length}</Text></View></GradientBorderWrapper>
                    <GradientBorderWrapper><View style={styles.cardInfo}><Text style={styles.cardLabel}>Notas do Mês</Text><Text style={styles.cardValue}>{notasDoMes}</Text></View></GradientBorderWrapper>
                    <GradientBorderWrapper flexValue={1.5}><View style={styles.cardInfo}><Text style={styles.cardLabel}>Valor Faturado</Text><Text style={styles.cardValue}><Text style={{ fontSize: 20, fontWeight: 'normal' }}>R$ </Text>{valorTotalFaturado.toFixed(2).replace('.', ',')}</Text></View></GradientBorderWrapper>
                </View>

                <View style={styles.splitLayout}>
                    <View style={{ flex: 1.8 }}>
                        <GradientBorderWrapper>
                            <View style={styles.chartSection}>
                                <Text style={styles.sectionTitle}>Visão Geral</Text>
                                {[
                                    { label: 'V.F.', val: valorTotalFaturado },
                                    { label: 'N.Mês', val: notasDoMes },
                                    { label: 'T.N.', val: listaNotas.length }
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
                                <Text style={styles.sectionTitle}>Últimas Notas Fiscais</Text>

                                {/* CABEÇALHO DA TABELA ATUALIZADO */}
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>Nº</Text>
                                    <Text style={[styles.tableHeaderText, { flex: 2 }]}>Cliente</Text>
                                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>Data</Text>
                                    <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Valor</Text>
                                    <Text style={[styles.tableHeaderText, { width: 70, textAlign: 'center', marginLeft: 15 }]}>Ações</Text>
                                </View>

                                {/* LISTA DE NOTAS (COM NUMERAÇÃO DINÂMICA) */}
                                {notasDaPagina.map((nota: any, index: number) => {
                                    // Calcula o número real baseado na ordem total (a mais nova é a de número maior)
                                    const numeroDinamico = listaNotas.length - (indexPrimeiroItem + index);

                                    return (
                                        <View key={nota.id} style={styles.tableRow}>
                                            <Text style={{ flex: 0.8, color: theme.mixEnd, fontWeight: 'bold' }}>#{numeroDinamico.toString().padStart(3, '0')}</Text>
                                            <Text style={{ flex: 2, color: theme.textPrimary }} numberOfLines={1}>{nota.cliente}</Text>
                                            <Text style={{ flex: 1, color: theme.textSecondary }}>{nota.data}</Text>
                                            <Text style={{ flex: 1, textAlign: 'right', color: theme.textSecondary }}>R$ {nota.valor}</Text>
                                            <View style={{ width: 70, flexDirection: 'row', justifyContent: 'center', gap: 15, marginLeft: 15 }}>
                                                <TouchableOpacity onPress={() => setNotaEmEdicao(nota)}><Feather name="edit" size={16} color={theme.mixStart} /></TouchableOpacity>
                                                <TouchableOpacity onPress={() => removerNota(nota.id)}><Feather name="trash-2" size={16} color="#EF4444" /></TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })}

                                {/* CONTROLES DE PAGINAÇÃO */}
                                {totalPaginas > 1 && (
                                    <View style={styles.paginationContainer}>
                                        <TouchableOpacity
                                            onPress={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                                            disabled={paginaAtual === 1}
                                            style={{ opacity: paginaAtual === 1 ? 0.3 : 1, padding: 5 }}
                                        >
                                            <Feather name="chevron-left" size={24} color="#FFF" />
                                        </TouchableOpacity>

                                        <View style={{ flexDirection: 'row', gap: 10 }}>
                                            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                                                <TouchableOpacity
                                                    key={num}
                                                    onPress={() => setPaginaAtual(num)}
                                                    style={[styles.pageButton, paginaAtual === num && styles.pageButtonActive]}
                                                >
                                                    <Text style={{ color: '#FFF', fontWeight: paginaAtual === num ? 'bold' : 'normal' }}>{num}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>

                                        <TouchableOpacity
                                            onPress={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                                            disabled={paginaAtual === totalPaginas}
                                            style={{ opacity: paginaAtual === totalPaginas ? 0.3 : 1, padding: 5 }}
                                        >
                                            <Feather name="chevron-right" size={24} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                                {listaNotas.length === 0 && (
                                    <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>Nenhuma nota registrada.</Text>
                                )}
                            </View>
                        </GradientBorderWrapper>
                    </View>

                    <GradientBorderWrapper>
                        <View style={styles.quickFormSection}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 25 }}>Novo Registro</Text>
                            <TextInput style={styles.formInput} placeholder="Nome/Razão Social" placeholderTextColor={theme.textSecondary} value={quickNome} onChangeText={setQuickNome} />
                            <TextInput style={styles.formInput} placeholder="Valor Total (R$)" keyboardType="numeric" placeholderTextColor={theme.textSecondary} value={quickValor} onChangeText={setQuickValor} />
                            <TouchableOpacity onPress={gerarNotaRapida}>
                                <LinearGradient colors={[theme.mixStart, theme.mixEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGerarNota}>
                                    <Text style={{ color: '#000', fontWeight: 'bold' }}>Gerar Nota</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </GradientBorderWrapper>
                </View>
            </ScrollView>

            {notaEmEdicao && (
                <Modal transparent visible animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: theme.bgCardBlue, borderColor: theme.mixStart, borderWidth: 1 }]}>
                            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Editar Cliente/Valor</Text>
                            <TextInput style={styles.formInput} value={notaEmEdicao.cliente} onChangeText={(t) => setNotaEmEdicao({ ...notaEmEdicao, cliente: t })} />
                            <TextInput style={styles.formInput} value={notaEmEdicao.valor} onChangeText={(t) => setNotaEmEdicao({ ...notaEmEdicao, valor: t })} />
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
    chartYLabel: { width: 50, color: '#A0A4B8', fontSize: 12, fontWeight: 'bold' },
    chartTrack: { flex: 1, height: 25, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4 },
    chartBar: { height: 25, borderRadius: 4 },
    tableSection: { borderRadius: 15, padding: 25, flex: 1, backgroundColor: theme.bgCardBlue },
    tableHeader: { flexDirection: 'row', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: theme.border },
    tableHeaderText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', paddingVertical: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    quickFormSection: { flex: 1, borderRadius: 15, padding: 30, backgroundColor: theme.bgCardForm },
    formInput: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 12, marginBottom: 15, color: '#FFF', backgroundColor: theme.inputBg },
    btnGerarNota: { padding: 15, borderRadius: 8, alignItems: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: 400, padding: 35, borderRadius: 16 },
    modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 25 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 25 },

    // Novos Estilos de Paginação
    paginationContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 25, gap: 15 },
    pageButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
    pageButtonActive: { backgroundColor: theme.mixEnd, shadowColor: theme.mixEnd, shadowOpacity: 0.5, shadowRadius: 5 }
});