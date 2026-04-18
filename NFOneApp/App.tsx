import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, TextInput, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import Login from './src/screens/Login';
import Faturamento from './src/screens/Faturamento';
import CatalogoTecnico from './src/screens/CatalogoTecnico';
import AdminEquipamentos from './src/screens/AdminEquipamentos';
import Logistica from './src/screens/Logistica';

const theme = {
  bgSidebar: '#111522',
  headerBg: '#0A0E1A',
  bgGradientStart: '#0B132B',
  bgGradientEnd: '#1C3A63',
  bgCardBlue: '#151A30',
  bgCardForm: '#1A2035',
  inputBg: '#0F131F',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A4B8',
  border: '#2A2F45',
  mixStart: '#00C6FF',
  mixEnd: '#22C55E',
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

export default function App() {
  const [isAutenticado, setIsAutenticado] = useState(false);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  const [telaAtual, setTelaAtual] = useState('dashboard');
  const [listaNotas, setListaNotas] = useState<any[]>([]);
  const [valorTotalFaturado, setValorTotalFaturado] = useState(0);
  const [notasDoMes, setNotasDoMes] = useState(0);

  const [quickNome, setQuickNome] = useState('');
  const [quickCnpj, setQuickCnpj] = useState('');
  const [quickPagamento, setQuickPagamento] = useState('PIX');
  const [quickValor, setQuickValor] = useState('');
  const [notaEmEdicao, setNotaEmEdicao] = useState<any>(null);

  const verificarLoginSalvo = async () => {
    try {
      const authStatus = await AsyncStorage.getItem('@nfone_auth');
      if (authStatus === 'true') setIsAutenticado(true);
    } catch (error) { console.error(error); }
    finally { setCarregandoAuth(false); }
  };

  const fazerLogin = async () => {
    await AsyncStorage.setItem('@nfone_auth', 'true');
    setIsAutenticado(true);
  };

  const fazerLogout = async () => {
    await AsyncStorage.removeItem('@nfone_auth');
    setIsAutenticado(false);
  };

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
            const anoNota = parseInt(partesData[2] || anoAtual);
            if (mesNota === mesAtual && anoNota === anoAtual) {
              qtdMesAtual++;
            }
          } else { qtdMesAtual++; }
        });

        setValorTotalFaturado(total);
        setNotasDoMes(qtdMesAtual);
      }
    } catch (error) { console.error("Erro ao buscar notas:", error); }
  };

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

      if (Platform.OS === 'web') {
        setTimeout(() => alert("Nota atualizada com sucesso!"), 100);
      }
    } catch (error) { console.error(error); }
  };

  const gerarNotaRapida = async () => {
    if (!quickNome || !quickValor) return alert("Preencha Nome e Valor.");

    try {
      // 1. Busca as notas já salvas para saber qual é o último número
      const notasSalvas = await AsyncStorage.getItem('@nfone_notas');
      const notasArray = notasSalvas ? JSON.parse(notasSalvas) : [];

      // 2. Lógica para Sequência Crescente
      let proxNumero = 1;
      if (notasArray.length > 0) {
        // Pega a nota mais recente (que está na posição 0), remove o "#" e transforma em número
        const ultimoNumero = parseInt(notasArray[0].numero.replace('#', ''), 10);
        if (!isNaN(ultimoNumero)) {
          proxNumero = ultimoNumero + 1; // Soma 1 ao último número
        } else {
          proxNumero = notasArray.length + 1; // Fallback de segurança
        }
      }

      // Converte o número para texto e preenche com zeros (Ex: 1 vira "0001")
      const numNota = `#${proxNumero.toString().padStart(4, '0')}`;
      const dataAtual = new Date().toLocaleDateString('pt-BR');

      const html = `<html><body style="font-family: Arial; padding: 40px; color: #333;"><h1 style="color: #22C55E;">NFONE - Recibo</h1><p>Emissão: ${dataAtual} | Nota: ${numNota}</p><hr/><p><b>Cliente:</b> ${quickNome}</p><p><b>CPF/CNPJ:</b> ${quickCnpj || '-'}</p><p><b>Pagamento:</b> ${quickPagamento}</p><h2 style="color: #22C55E;">Valor Total: R$ ${quickValor}</h2></body></html>`;

      const novaNota = { id: Date.now().toString(), numero: numNota, cliente: quickNome, data: dataAtual, valor: quickValor, pagamento: quickPagamento };
      notasArray.unshift(novaNota);
      await AsyncStorage.setItem('@nfone_notas', JSON.stringify(notasArray));

      await carregarNotas();

      setQuickNome('');
      setQuickCnpj('');
      setQuickValor('');
      setQuickPagamento('PIX');

      setTimeout(async () => {
        if (Platform.OS === 'web') {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
          }
        } else {
          await Print.printAsync({ html });
        }
      }, 300);

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    verificarLoginSalvo();
    carregarNotas();
  }, []);

  const calcBarWidth = (val: number): any => {
    if (val === 0) return '0%';
    const maxValue = Math.max(valorTotalFaturado, listaNotas.length, 10);
    let percentage = (Math.log10(val + 1) / Math.log10(maxValue + 1)) * 100;
    return `${Math.min(Math.max(percentage, 5), 100)}%`;
  };

  if (carregandoAuth) return <View style={{ flex: 1, backgroundColor: theme.bgGradientStart }} />;
  if (!isAutenticado) return <Login onLogin={fazerLogin} />;

  return (
    <View style={styles.container}>

      <View style={[styles.sidebar, { backgroundColor: theme.bgSidebar, borderRightColor: theme.mixEnd, borderRightWidth: 1 }]}>

        <View style={styles.logoContainer}>
          <Text style={styles.brand}>
            <Text style={{ color: theme.mixEnd }}>N F O N E</Text>
          </Text>
          <Text style={[styles.brandSub, { color: theme.textPrimary }]}>Sistema de Notas Fiscais</Text>
        </View>

        <View style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setTelaAtual('dashboard'); carregarNotas(); }}>
            <Feather name="home" size={20} color={telaAtual === 'dashboard' ? theme.mixEnd : theme.textSecondary} style={{ marginRight: 15 }} />
            <Text style={[styles.menuText, { color: telaAtual === 'dashboard' ? theme.mixEnd : theme.textSecondary, fontWeight: telaAtual === 'dashboard' ? 'bold' : 'normal' }]}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => setTelaAtual('faturamento')}>
            <Feather name="file-text" size={20} color={telaAtual === 'faturamento' ? theme.mixEnd : theme.textSecondary} style={{ marginRight: 15 }} />
            <Text style={[styles.menuText, { color: telaAtual === 'faturamento' ? theme.mixEnd : theme.textSecondary, fontWeight: telaAtual === 'faturamento' ? 'bold' : 'normal' }]}>Notas Fiscais</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => setTelaAtual('catalogo')}>
            <Feather name="users" size={20} color={telaAtual === 'catalogo' ? theme.mixEnd : theme.textSecondary} style={{ marginRight: 15 }} />
            <Text style={[styles.menuText, { color: telaAtual === 'catalogo' ? theme.mixEnd : theme.textSecondary, fontWeight: telaAtual === 'catalogo' ? 'bold' : 'normal' }]}>Clientes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => setTelaAtual('logistica')}>
            <Feather name="calendar" size={20} color={telaAtual === 'logistica' ? theme.mixEnd : theme.textSecondary} style={{ marginRight: 15 }} />
            <Text style={[styles.menuText, { color: telaAtual === 'logistica' ? theme.mixEnd : theme.textSecondary, fontWeight: telaAtual === 'logistica' ? 'bold' : 'normal' }]}>Agenda</Text>
          </TouchableOpacity>
        </View>

        <View>
          <View style={[styles.profileSidebar, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <View style={styles.profileAvatar}><Feather name="user" size={18} color="#FFF" /></View>
            <View>
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Ágatha</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Administradora</Text>
            </View>
          </View>

          <TouchableOpacity onPress={fazerLogout} style={[styles.logoutBtn, { borderColor: theme.border }]}>
            <Feather name="log-out" size={18} color={theme.textSecondary} style={{ marginRight: 10 }} />
            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Sair do Sistema</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContent}>

        <View style={[styles.topHeader, { backgroundColor: theme.headerBg, borderBottomColor: theme.mixStart, borderBottomWidth: 1 }]}>
          <View style={[styles.searchBar, { backgroundColor: theme.inputBg, borderColor: theme.border, borderWidth: 1 }]}>
            <Feather name="search" size={18} color={theme.mixStart} style={{ marginRight: 10 }} />
            <TextInput style={{ flex: 1, color: '#FFF', outlineStyle: 'none' as any }} placeholder="Buscar..." placeholderTextColor={theme.textSecondary} />
          </View>

          <View style={styles.topProfile}>
            <Feather name="bell" size={20} color={theme.mixStart} style={{ marginRight: 20 }} />
            <Feather name="mail" size={20} color={theme.mixStart} style={{ marginRight: 25 }} />
            <View style={[styles.profileAvatarMini, { borderColor: theme.mixStart, borderWidth: 1 }]}><Feather name="user" size={16} color={theme.mixStart} /></View>
            <Text style={{ color: '#FFF', marginLeft: 10, fontWeight: 'bold' }}>Ágatha</Text>
          </View>
        </View>

        <LinearGradient
          colors={[theme.bgGradientStart, theme.bgGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          {telaAtual === 'dashboard' ? (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 40, paddingBottom: 40, paddingTop: 30 }}>

              <View style={{ marginBottom: 30 }}>
                <Text style={{ fontSize: 26, color: '#FFF' }}>Bem-Vindo, <Text style={{ color: theme.mixEnd, fontWeight: 'bold' }}>Ágatha</Text>!</Text>
                <Text style={{ fontSize: 16, color: '#FFF', marginTop: 5 }}>Gerencie suas notas fiscais rapidamente.</Text>
              </View>

              <View style={styles.dashboardCards}>
                <GradientBorderWrapper>
                  <View style={[styles.cardInfo, { backgroundColor: theme.bgCardBlue }]}>
                    <Text style={styles.cardLabel}>Total de notas</Text>
                    <Text style={styles.cardValue}>{listaNotas.length}</Text>
                  </View>
                </GradientBorderWrapper>

                <GradientBorderWrapper>
                  <View style={[styles.cardInfo, { backgroundColor: theme.bgCardBlue }]}>
                    <Text style={styles.cardLabel}>Notas do Mês</Text>
                    <Text style={styles.cardValue}>{notasDoMes}</Text>
                  </View>
                </GradientBorderWrapper>

                <GradientBorderWrapper flexValue={1.5}>
                  <View style={[styles.cardInfo, { backgroundColor: theme.bgCardBlue }]}>
                    <Text style={styles.cardLabel}>Valor Faturado</Text>
                    <Text style={styles.cardValue}><Text style={{ fontSize: 20, fontWeight: 'normal' }}>R$ </Text>{valorTotalFaturado.toFixed(2).replace('.', ',')}</Text>
                  </View>
                </GradientBorderWrapper>
              </View>

              <View style={styles.splitLayout}>

                <View style={{ flex: 1.8 }}>
                  <GradientBorderWrapper>
                    <View style={[styles.chartSection, { backgroundColor: theme.bgCardBlue }]}>
                      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Visão Geral</Text>

                      <View style={styles.chartArea}>
                        <View style={styles.chartRow}>
                          <Text style={styles.chartYLabel}>V.F.</Text>
                          <View style={styles.chartTrack}>
                            <LinearGradient colors={[theme.mixStart, theme.mixEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.chartBar, { width: calcBarWidth(valorTotalFaturado) }]} />
                          </View>
                        </View>

                        <View style={styles.chartRow}>
                          <Text style={styles.chartYLabel}>N.Mês</Text>
                          <View style={styles.chartTrack}>
                            <LinearGradient colors={[theme.mixStart, theme.mixEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.chartBar, { width: calcBarWidth(notasDoMes) }]} />
                          </View>
                        </View>

                        <View style={styles.chartRow}>
                          <Text style={styles.chartYLabel}>T.N.</Text>
                          <View style={styles.chartTrack}>
                            <LinearGradient colors={[theme.mixStart, theme.mixEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.chartBar, { width: calcBarWidth(listaNotas.length) }]} />
                          </View>
                        </View>

                        <View style={styles.chartXAxis}>
                          <Text style={styles.chartXLabel}></Text>
                          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 10 }}>
                            <Text style={styles.chartXLabel}>{notasDoMes}</Text>
                            <Text style={styles.chartXLabel}>{listaNotas.length}</Text>
                            <Text style={styles.chartXLabel}>{valorTotalFaturado.toFixed(0)}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </GradientBorderWrapper>

                  <View style={{ height: 20 }} />

                  <GradientBorderWrapper>
                    <View style={[styles.tableSection, { backgroundColor: theme.bgCardBlue }]}>
                      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Últimas Notas Fiscais</Text>

                      <View style={{ flexDirection: 'row', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Nº Nota</Text>
                        <Text style={[styles.tableHeaderText, { flex: 2 }]}>Cliente</Text>
                        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Data</Text>
                        <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Valor</Text>
                        <Text style={[styles.tableHeaderText, { width: 70, textAlign: 'center', marginLeft: 15 }]}>Ações</Text>
                      </View>

                      {/* Removido o ".slice(0, 5)" para a lista ser infinita! */}
                      {listaNotas.map((nota: any) => (
                        <View key={nota.id} style={{ flexDirection: 'row', paddingVertical: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' }}>
                          <Text style={{ flex: 1, color: theme.mixEnd, fontWeight: 'bold' }}>{nota.numero}</Text>
                          <Text style={{ flex: 2, color: theme.textPrimary }}>{nota.cliente}</Text>
                          <Text style={{ flex: 1, color: theme.textSecondary }}>{nota.data}</Text>
                          <Text style={{ flex: 1, textAlign: 'right', color: theme.textSecondary }}>R$ {nota.valor}</Text>

                          <View style={{ width: 70, flexDirection: 'row', justifyContent: 'center', gap: 15, marginLeft: 15 }}>
                            <TouchableOpacity onPress={() => setNotaEmEdicao(nota)}>
                              <Feather name="edit" size={16} color={theme.mixStart} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => removerNota(nota.id)}>
                              <Feather name="trash-2" size={16} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}

                    </View>
                  </GradientBorderWrapper>
                </View>

                <GradientBorderWrapper>
                  <View style={[styles.quickFormSection, { backgroundColor: theme.bgCardForm }]}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 25 }}>Novo Registro de <Text style={{ color: theme.mixEnd }}>Nota</Text></Text>

                    <Text style={styles.formLabel}>Dados do Cliente</Text>
                    <TextInput style={[styles.formInput, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.inputBg }]} placeholderTextColor={theme.textSecondary} placeholder="Nome/Razão Social" value={quickNome} onChangeText={setQuickNome} />
                    <TextInput style={[styles.formInput, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.inputBg }]} placeholderTextColor={theme.textSecondary} placeholder="CPF/CNPJ" value={quickCnpj} onChangeText={setQuickCnpj} />

                    <Text style={[styles.formLabel, { marginTop: 10 }]}>Dados de Pagamento</Text>

                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                      <TouchableOpacity onPress={() => setQuickPagamento('PIX')} style={[styles.radioBtn, quickPagamento === 'PIX' && { borderColor: theme.mixEnd, backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                        <Text style={{ color: quickPagamento === 'PIX' ? theme.mixEnd : theme.textSecondary, fontSize: 12, fontWeight: quickPagamento === 'PIX' ? 'bold' : 'normal' }}>PIX</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setQuickPagamento('Cartão')} style={[styles.radioBtn, quickPagamento === 'Cartão' && { borderColor: theme.mixEnd, backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                        <Text style={{ color: quickPagamento === 'Cartão' ? theme.mixEnd : theme.textSecondary, fontSize: 12, fontWeight: quickPagamento === 'Cartão' ? 'bold' : 'normal' }}>Cartão</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setQuickPagamento('Boleto')} style={[styles.radioBtn, quickPagamento === 'Boleto' && { borderColor: theme.mixEnd, backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                        <Text style={{ color: quickPagamento === 'Boleto' ? theme.mixEnd : theme.textSecondary, fontSize: 12, fontWeight: quickPagamento === 'Boleto' ? 'bold' : 'normal' }}>Boleto</Text>
                      </TouchableOpacity>
                    </View>

                    <TextInput style={[styles.formInput, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.inputBg }]} placeholderTextColor={theme.textSecondary} placeholder="Valor Total (R$)" keyboardType="numeric" value={quickValor} onChangeText={setQuickValor} />

                    <TouchableOpacity onPress={gerarNotaRapida}>
                      <LinearGradient colors={[theme.mixStart, theme.mixEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGerarNota}>
                        <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 14 }}>Gerar Nova Nota</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </GradientBorderWrapper>

              </View>
            </ScrollView>
          ) : (
            telaAtual === 'faturamento' ? <Faturamento isDarkMode={true} /> :
              telaAtual === 'catalogo' ? <CatalogoTecnico isDarkMode={true} /> :
                telaAtual === 'logistica' ? <Logistica isDarkMode={true} /> :
                  telaAtual === 'admin' ? <AdminEquipamentos isDarkMode={true} /> : null
          )}
        </LinearGradient>
      </View>

      {/* MODAL */}
      {notaEmEdicao && (
        <Modal transparent={true} animationType="fade" visible={true}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.bgCardBlue, borderColor: theme.mixStart, borderWidth: 1 }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Editar: {notaEmEdicao.numero}</Text>
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>Cliente</Text>
              <TextInput style={[styles.formInput, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.inputBg }]} value={notaEmEdicao.cliente} onChangeText={(t) => setNotaEmEdicao({ ...notaEmEdicao, cliente: t })} />
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>Data</Text>
              <TextInput style={[styles.formInput, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.inputBg }]} value={notaEmEdicao.data} onChangeText={(t) => setNotaEmEdicao({ ...notaEmEdicao, data: t })} />
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>Valor (R$)</Text>
              <TextInput style={[styles.formInput, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.inputBg }]} value={notaEmEdicao.valor} onChangeText={(t) => setNotaEmEdicao({ ...notaEmEdicao, valor: t })} />
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.btnCancel, { backgroundColor: 'transparent' }]} onPress={() => setNotaEmEdicao(null)}><Text style={{ color: theme.textPrimary, fontWeight: 'bold' }}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity onPress={salvarEdicao}>
                  <LinearGradient colors={[theme.mixStart, theme.mixEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnSave}>
                    <Text style={{ color: '#000', fontWeight: 'bold' }}>Salvar</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 250, padding: 25, justifyContent: 'space-between' },
  logoContainer: { marginBottom: 40, marginTop: 10 },
  brand: { fontSize: 26, fontWeight: '800', letterSpacing: 3 },
  brandSub: { fontSize: 11, marginTop: 5 },
  menuGroup: { flex: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, marginBottom: 5 },
  menuText: { fontSize: 15 },

  profileSidebar: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
  profileAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0, 198, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, justifyContent: 'center' },

  mainContent: { flex: 1, flexDirection: 'column' },
  topHeader: { height: 80, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 40 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 40, borderRadius: 20, flex: 1, maxWidth: 400 },
  topProfile: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
  profileAvatarMini: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0, 198, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },

  dashboardCards: { flexDirection: 'row', gap: 20, marginBottom: 30 },
  cardInfo: { flex: 1, padding: 25, borderRadius: 15, alignItems: 'center', justifyContent: 'center', height: '100%' },
  cardLabel: { fontSize: 14, color: '#A0A4B8', marginBottom: 10 },
  cardValue: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },

  splitLayout: { flexDirection: 'row', gap: 20 },

  chartSection: { borderRadius: 15, padding: 25, flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  chartArea: { marginTop: 10 },
  chartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  chartYLabel: { width: 50, color: '#A0A4B8', fontSize: 12, fontWeight: 'bold' },
  chartTrack: { flex: 1, height: 25, backgroundColor: 'transparent', justifyContent: 'center' },
  chartBar: { height: 25, borderRadius: 4 },
  chartXAxis: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#232942', paddingTop: 10, marginTop: 10 },
  chartXLabel: { color: '#A0A4B8', fontSize: 11 },

  tableSection: { borderRadius: 15, padding: 25, flex: 1 },
  tableHeaderText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },

  quickFormSection: { flex: 1, borderRadius: 15, padding: 30 },
  formLabel: { color: '#FFF', fontSize: 13, marginBottom: 10, fontWeight: 'bold' },
  formInput: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 13 },
  radioBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  btnGerarNota: { padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: 400, padding: 35, borderRadius: 16 },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 25 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 25 },
  btnCancel: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  btnSave: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 }
});