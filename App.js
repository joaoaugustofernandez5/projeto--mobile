import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Switch, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput,
  Modal 
} from 'react-native';

const BASE_URL = 'http://10.137.11.6/api/sensor/status';

export default function App() {
  const [sensores, setSensores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [sensorDetalhe, setSensorDetalhe] = useState(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/listar`)
      .then(res => res.json())
      .then(json => {
        setSensores(json.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao buscar:", err);
        setLoading(false);
      });
  }, []);

  const toggleStatus = (codigo, statusAtual) => {
    const novoStatus = statusAtual === 1 ? 0 : 1;

    setSensores(prev =>
      prev.map(s => (s.codigo === codigo ? { ...s, status: novoStatus } : s))
    );

    fetch(`${BASE_URL}/atualizar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, status: novoStatus }),
    }).catch(err => console.error("Erro ao atualizar:", err));
  };

  const visualizarSensor = (codigo) => {
    setCarregandoDetalhe(true);
    setModalVisible(true);
    fetch(`${BASE_URL}/visualizar/${codigo.toLowerCase()}`)
      .then(res => res.json())
      .then(json => {
        setSensorDetalhe({ codigo, ...json });
        setCarregandoDetalhe(false);
      })
      .catch(err => {
        console.error("Erro ao visualizar:", err);
        setCarregandoDetalhe(false);
      });
  };

  const filtrados = sensores.filter(s => 
    s.codigo.toLowerCase().includes(busca.toLowerCase()) ||
    s.tipo.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Painel IoT</Text>

      <TextInput
        style={styles.input}
        placeholder="Pesquisar sensor..."
        value={busca}
        onChangeText={setBusca}
      />

      <FlatList
        data={filtrados}
        keyExtractor={(item) => item.codigo}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.codigo}>{item.codigo}</Text>
              <Text style={styles.tipo}>{item.tipo}</Text>
            </View>

            <View style={styles.acoes}>
              <TouchableOpacity 
                style={styles.botaoVer}
                onPress={() => visualizarSensor(item.codigo)}
              >
                <Text style={styles.textoBotaoVer}>Ver</Text>
              </TouchableOpacity>

              <Switch
                value={item.status === 1}
                onValueChange={() => toggleStatus(item.codigo, item.status)}
              />
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Detalhes</Text>
            {carregandoDetalhe ? (
              <ActivityIndicator size="small" color="#007AFF" style={{ margin: 20 }} />
            ) : (
              <View style={{ marginVertical: 10 }}>
                <Text style={styles.textoModal}>Código: {sensorDetalhe?.codigo}</Text>
                <Text style={styles.textoModal}>Status: {sensorDetalhe?.status === 1 ? 'Ligado' : 'Desligado'}</Text>
                <Text style={styles.textoModal}>Msg: {sensorDetalhe?.success || sensorDetalhe?.message || 'OK'}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  codigo: { fontSize: 18, fontWeight: 'bold' },
  tipo: { fontSize: 14, color: '#666' },
  acoes: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  botaoVer: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  textoBotaoVer: { color: '#FFF', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', padding: 20, borderRadius: 10, width: '80%', alignItems: 'center' },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  textoModal: { fontSize: 16, marginBottom: 5 },
  botaoFechar: { backgroundColor: '#FF3B30', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6, marginTop: 15 }
});