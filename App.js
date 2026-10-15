import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Switch, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView,
  Modal 
} from 'react-native';

const BASE_URL = 'http://10.137.11.6/api/sensor/status';

export default function App() {
  const [sensores, setSensores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [sensorDetalhe, setSensorDetalhe] = useState(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  // 1. Buscar a lista de sensores (/listar)
  const carregarSensores = async () => {
    try {
      const response = await fetch(`${BASE_URL}/listar`);
      const json = await response.json();
      setSensores(json.data || []);
    } catch (error) {
      console.error("Erro ao carregar sensores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarSensores();
  }, []);

  // 2. Ativar ou desativar o sensor (/atualizar)
  const toggleStatus = async (codigo, statusAtual) => {
    const novoStatus = statusAtual === 1 ? 0 : 1;

    // Atualiza visualmente na hora (otimista)
    setSensores(prev =>
      prev.map(s => (s.codigo === codigo ? { ...s, status: novoStatus } : s))
    );

    try {
      await fetch(`${BASE_URL}/atualizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, status: novoStatus }),
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      carregarSensores(); // Reverte se falhar
    }
  };

  // 3. Visualizar um sensor específico (/visualizar/{codigo})
  const visualizarSensor = async (codigo) => {
    setCarregandoDetalhe(true);
    setModalVisible(true);
    try {
      const response = await fetch(`${BASE_URL}/visualizar/${codigo.toLowerCase()}`);
      const json = await response.json();
      setSensorDetalhe({ codigo, ...json });
    } catch (error) {
      console.error("Erro ao visualizar sensor:", error);
      setSensorDetalhe(null);
    } finally {
      setCarregandoDetalhe(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Carregando sensores...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titulo}>Painel de Sensores IoT</Text>

      <FlatList
        data={sensores}
        keyExtractor={(item) => item.codigo}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.codigo}>{item.codigo}</Text>
              <Text style={styles.tipo}>{item.tipo}</Text>
            </View>

            <View style={styles.acoes}>
              <TouchableOpacity 
                style={styles.botaoVisualizar} 
                onPress={() => visualizarSensor(item.codigo)}
              >
                <Text style={styles.textoBotaoVisualizar}>Visualizar</Text>
              </TouchableOpacity>

              <Switch
                value={item.status === 1}
                onValueChange={() => toggleStatus(item.codigo, item.status)}
              />
            </View>
          </View>
        )}
      />

      {/* Modal para exibir os detalhes do sensor ao clicar em "Visualizar" */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Detalhes do Sensor</Text>
            {carregandoDetalhe ? (
              <ActivityIndicator size="small" color="#007AFF" style={{ margin: 20 }} />
            ) : (
              <View style={{ marginVertical: 10 }}>
                <Text style={styles.modalTexto}>Código: {sensorDetalhe?.codigo}</Text>
                <Text style={styles.modalTexto}>Status: {sensorDetalhe?.status === 1 ? 'Ativo (1)' : 'Desativado (0)'}</Text>
                <Text style={styles.modalTexto}>Mensagem: {sensorDetalhe?.success || sensorDetalhe?.message}</Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.botaoFechar} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  card: { 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 8, 
    marginBottom: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  codigo: { fontSize: 18, fontWeight: 'bold' },
  tipo: { fontSize: 14, color: '#666', textTransform: 'capitalize' },
  acoes: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  botaoVisualizar: { backgroundColor: '#007AFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  textoBotaoVisualizar: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#FFF', padding: 24, borderRadius: 10, width: '80%', alignItems: 'center' },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalTexto: { fontSize: 16, marginBottom: 8, color: '#333' },
  botaoFechar: { backgroundColor: '#FF3B30', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6, marginTop: 15 }
});