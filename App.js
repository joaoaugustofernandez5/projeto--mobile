
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  FlatList,
  Pressable,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

const API_URL = 'http://10.137.11.6/api/sensor/status/listar';

const COLORS = {
  background: '#F3F6FB',
  white: '#FFFFFF',
  blue: '#2563EB',
  dark: '#0F172A',
  text: '#334155',
  muted: '#64748B',
  border: '#E2E8F0',
  green: '#15803D',
  greenBg: '#DCFCE7',
  red: '#B91C1C',
  redBg: '#FEE2E2',
  orange: '#B45309',
  orangeBg: '#FEF3C7',
};

function getStatus(sensor) {
  const value = String(
    sensor?.status ?? sensor?.situacao ?? ''
  ).toLowerCase();

  if (['ativo', 'online', 'normal', 'ok', 'funcionando'].includes(value)) {
    return 'ativo';
  }

  if (
    ['inativo', 'offline', 'desligado', 'indisponível', 'indisponivel'].includes(value)
  ) {
    return 'inativo';
  }

  if (['alerta', 'atenção', 'atencao', 'aviso'].includes(value)) {
    return 'alerta';
  }

  return value || 'desconhecido';
}

function statusStyle(status) {
  if (status === 'ativo') {
    return { color: COLORS.green, backgroundColor: COLORS.greenBg };
  }

  if (status === 'inativo') {
    return { color: COLORS.red, backgroundColor: COLORS.redBg };
  }

  if (status === 'alerta') {
    return { color: COLORS.orange, backgroundColor: COLORS.orangeBg };
  }

  return { color: COLORS.muted, backgroundColor: '#F1F5F9' };
}

function statusLabel(status) {
  const labels = {
    ativo: 'Ativo',
    inativo: 'Inativo',
    alerta: 'Em alerta',
    desconhecido: 'Não informado',
  };

  return labels[status] || status;
}

function Button({ title, onPress, secondary = false }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          secondary && styles.buttonSecondaryText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function SensorCard({ sensor }) {
  const status = getStatus(sensor);
  const badge = statusStyle(status);
  const code = sensor?.codigo ?? sensor?.id ?? 'Sem código';
  const type = sensor?.tipo ?? sensor?.nome ?? 'Sensor';

  return (
    <View style={styles.sensorCard}>
      <View style={styles.sensorTop}>
        <View style={styles.sensorIcon}>
          <Text style={styles.sensorIconText}>◉</Text>
        </View>

        <View style={styles.sensorInfo}>
          <Text style={styles.sensorName}>{String(type)}</Text>
          <Text style={styles.sensorCode}>Código: {String(code)}</Text>
        </View>

        <View style={[styles.badge, { backgroundColor: badge.backgroundColor }]}>
          <Text style={[styles.badgeText, { color: badge.color }]}>
            {statusLabel(status)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SummaryCard({ title, value, color }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </View>
  );
}

export default function App() {
  const [page, setPage] = useState('inicio');
  const [sensors, setSensors] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);

  const loadSensors = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    }

    try {
      setError('');

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error('Erro HTTP ' + response.status);
      }

      const json = await response.json();

      let list = [];

      if (Array.isArray(json)) {
        list = json;
      } else if (Array.isArray(json?.data)) {
        list = json.data;
      } else if (Array.isArray(json?.sensores)) {
        list = json.sensores;
      } else if (Array.isArray(json?.resultado)) {
        list = json.resultado;
      } else {
        throw new Error('A API não retornou uma lista de sensores.');
      }

      setSensors(list);
      setLastUpdate(new Date());
    } catch (err) {
      setError(
        'Não foi possível carregar os sensores. Confira o endereço da API e a conexão com o servidor.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSensors();

    const timer = setInterval(() => {
      loadSensors();
    }, 15000);

    return () => clearInterval(timer);
  }, [loadSensors]);

  const activeCount = sensors.filter(
    (sensor) => getStatus(sensor) === 'ativo'
  ).length;

  const inactiveCount = sensors.filter(
    (sensor) => getStatus(sensor) === 'inativo'
  ).length;

  const alertCount = sensors.filter(
    (sensor) => getStatus(sensor) === 'alerta'
  ).length;

  const filteredSensors = sensors.filter((sensor) => {
    const code = String(sensor?.codigo ?? sensor?.id ?? '').toLowerCase();
    const type = String(sensor?.tipo ?? sensor?.nome ?? '').toLowerCase();
    const status = getStatus(sensor);
    const term = search.trim().toLowerCase();

    const matchesSearch =
      !term ||
      code.includes(term) ||
      type.includes(term) ||
      status.includes(term);

    const matchesFilter = filter === 'todos' || status === filter;

    return matchesSearch && matchesFilter;
  });

  function navigate(destination) {
    setPage(destination);
  }

  function renderSummary() {
    return (
      <View style={styles.summaryGrid}>
        <SummaryCard
          title="Total"
          value={sensors.length}
          color={COLORS.blue}
        />
        <SummaryCard
          title="Ativos"
          value={activeCount}
          color={COLORS.green}
        />
        <SummaryCard
          title="Inativos"
          value={inactiveCount}
          color={COLORS.red}
        />
        <SummaryCard
          title="Alertas"
          value={alertCount}
          color={COLORS.orange}
        />
      </View>
    );
  }

  function renderPageTitle(eyebrow, title, description) {
    return (
      <View style={styles.pageTitle}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.pageHeading}>{title}</Text>
        <Text style={styles.pageDescription}>{description}</Text>
      </View>
    );
  }

  function renderError() {
    if (!error) return null;

    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Tentar novamente" onPress={() => loadSensors(true)} />
      </View>
    );
  }

  function renderEmpty(message) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyIcon}>⌕</Text>
        <Text style={styles.emptyTitle}>Nenhum sensor encontrado</Text>
        <Text style={styles.emptyText}>{message}</Text>
      </View>
    );
  }

  function renderSensorList(list) {
    if (loading && sensors.length === 0) {
      return (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.blue} />
          <Text style={styles.mutedText}>Carregando sensores...</Text>
        </View>
      );
    }

    if (sensors.length === 0) {
      return renderEmpty('Não existem sensores disponíveis para exibição.');
    }

    if (list.length === 0) {
      return renderEmpty('Tente outro termo de pesquisa ou filtro.');
    }

    return list.map((sensor, index) => (
      <SensorCard
        key={String(sensor?.codigo ?? sensor?.id ?? index)}
        sensor={sensor}
      />
    ));
  }

  function renderHome() {
    return (
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTag}>MONITORAMENTO INTELIGENTE</Text>
          <Text style={styles.heroTitle}>
            Seus sensores, sob controle.
          </Text>
          <Text style={styles.heroDescription}>
            Consulte dispositivos, acompanhe os status e encontre informações
            rapidamente em um único lugar.
          </Text>

          <View style={styles.heroButtons}>
            <Button title="Ver sensores" onPress={() => navigate('sensores')} />
            <Button
              title="Pesquisar"
              secondary
              onPress={() => navigate('pesquisa')}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Visão geral</Text>
        <Text style={styles.sectionDescription}>
          Resumo dos dispositivos cadastrados
        </Text>

        {renderSummary()}
        {renderError()}

        <Text style={styles.sectionTitle}>Acesso rápido</Text>

        <Pressable
          style={styles.featureCard}
          onPress={() => navigate('sensores')}
        >
          <Text style={styles.featureIcon}>◉</Text>
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Lista de sensores</Text>
            <Text style={styles.featureText}>
              Veja todos os dispositivos e seus respectivos status.
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <Pressable
          style={styles.featureCard}
          onPress={() => navigate('pesquisa')}
        >
          <Text style={styles.featureIcon}>⌕</Text>
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Pesquisar sensores</Text>
            <Text style={styles.featureText}>
              Encontre sensores por código, tipo ou status.
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <Text style={styles.footer}>
          {lastUpdate
            ? 'Última atualização: ' + lastUpdate.toLocaleTimeString('pt-BR')
            : 'Os dados são atualizados automaticamente.'}
        </Text>
      </ScrollView>
    );
  }

  // Página 2: somente visualização da lista.
  function renderSensorsPage() {
    return (
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadSensors(true)}
          />
        }
      >
        {renderPageTitle(
          'MONITORAMENTO',
          'Meus sensores',
          'Consulte os dispositivos e acompanhe a situação de cada um.'
        )}

        {renderSummary()}
        {renderError()}

        <View style={styles.listHeading}>
          <Text style={styles.sectionTitle}>Todos os sensores</Text>
          <Text style={styles.mutedText}>
            {sensors.length} dispositivo(s)
          </Text>
        </View>

        {renderSensorList(sensors)}

        <Text style={styles.footer}>
          Atualização automática a cada 15 segundos.
        </Text>
      </ScrollView>
    );
  }

  // Página 3: pesquisa e filtros.
  function renderSearchPage() {
    return (
      <FlatList
        style={styles.page}
        contentContainerStyle={styles.content}
        data={filteredSensors}
        keyExtractor={(sensor, index) =>
          String(sensor?.codigo ?? sensor?.id ?? index)
        }
        renderItem={({ item }) => <SensorCard sensor={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadSensors(true)}
          />
        }
        ListHeaderComponent={
          <View>
            {renderPageTitle(
              'BUSCA INTELIGENTE',
              'Pesquisar sensores',
              'Busque por código, tipo ou status e filtre os resultados.'
            )}

            <View style={styles.searchPanel}>
              <Text style={styles.inputLabel}>Pesquisa</Text>

              <TextInput
                style={styles.input}
                value={search}
                onChangeText={setSearch}
                placeholder="Digite código, tipo ou status..."
                placeholderTextColor={COLORS.muted}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />

              <View style={styles.filterHeader}>
                <Text style={styles.inputLabel}>Filtrar por status</Text>
                <Pressable
                  onPress={() => {
                    setSearch('');
                    setFilter('todos');
                  }}
                >
                  <Text style={styles.clearText}>Limpar</Text>
                </Pressable>
              </View>

              <View style={styles.filters}>
                {[
                  ['todos', 'Todos'],
                  ['ativo', 'Ativos'],
                  ['inativo', 'Inativos'],
                  ['alerta', 'Alertas'],
                ].map(([value, label]) => (
                  <Pressable
                    key={value}
                    onPress={() => setFilter(value)}
                    style={[
                      styles.filterButton,
                      filter === value && styles.filterButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        filter === value && styles.filterTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {renderError()}

            <View style={styles.listHeading}>
              <Text style={styles.sectionTitle}>Resultados</Text>
              <Text style={styles.mutedText}>
                {filteredSensors.length} de {sensors.length}
              </Text>
            </View>

            {loading && sensors.length === 0 ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={COLORS.blue} />
                <Text style={styles.mutedText}>Carregando sensores...</Text>
              </View>
            ) : null}

            {!loading && sensors.length === 0 && !error
              ? renderEmpty('Não há sensores cadastrados.')
              : null}

            {sensors.length > 0 && filteredSensors.length === 0
              ? renderEmpty('Mude o termo de busca ou selecione outro filtro.')
              : null}
          </View>
        }
        ListEmptyComponent={null}
        ListFooterComponent={
          <Text style={styles.footer}>
            Os dados são atualizados automaticamente a cada 15 segundos.
          </Text>
        }
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.white}
      />

      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <View>
            <Text style={styles.brandName}>SensorTech</Text>
            <Text style={styles.brandSubtitle}>Monitoramento de sensores</Text>
          </View>
        </View>

        <View style={styles.navigation}>
          {[
            ['inicio', 'Início'],
            ['sensores', 'Sensores'],
            ['pesquisa', 'Pesquisar'],
          ].map(([id, label]) => (
            <Pressable
              key={id}
              onPress={() => navigate(id)}
              style={[
                styles.navItem,
                page === id && styles.navItemActive,
              ]}
            >
              <Text
                style={[
                  styles.navText,
                  page === id && styles.navTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {page === 'inicio'
        ? renderHome()
        : page === 'sensores'
          ? renderSensorsPage()
          : renderSearchPage()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingTop: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    gap: 10,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '900',
  },
  brandName: {
    fontSize: 17,
    color: COLORS.dark,
    fontWeight: '900',
  },
  brandSubtitle: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 3,
  },
  navigation: {
    flexDirection: 'row',
    gap: 8,
  },
  navItem: {
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  navItemActive: {
    borderBottomColor: COLORS.blue,
  },
  navText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
  },
  navTextActive: {
    color: COLORS.blue,
  },
  page: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 32,
  },
  hero: {
    backgroundColor: COLORS.dark,
    borderRadius: 22,
    padding: 22,
    marginBottom: 25,
  },
  heroTag: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 16,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 39,
  },
  heroDescription: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
  },
  heroButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
  },
  button: {
    backgroundColor: COLORS.blue,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12,
  },
  buttonSecondaryText: {
    color: COLORS.blue,
  },
  sectionTitle: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionDescription: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
    marginBottom: 14,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
    marginBottom: 23,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    width: '47%',
    flexGrow: 1,
  },
  summaryTitle: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: 29,
    fontWeight: '900',
    marginTop: 7,
  },
  featureCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 27,
    color: COLORS.blue,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: '800',
  },
  featureText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  arrow: {
    color: COLORS.blue,
    fontSize: 25,
  },
  pageTitle: {
    marginBottom: 20,
  },
  eyebrow: {
    color: COLORS.blue,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 7,
  },
  pageHeading: {
    color: COLORS.dark,
    fontSize: 27,
    fontWeight: '900',
  },
  pageDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 20,
    marginTop: 8,
  },
  listHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 13,
    gap: 10,
  },
  sensorCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 15,
    marginBottom: 11,
  },
  sensorTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sensorIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorIconText: {
    fontSize: 23,
    color: COLORS.blue,
  },
  sensorInfo: {
    flex: 1,
  },
  sensorName: {
    color: COLORS.dark,
    fontWeight: '800',
    fontSize: 13,
  },
  sensorCode: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 5,
  },
  badge: {
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 9,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  searchPanel: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  inputLabel: {
    color: COLORS.dark,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 9,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    color: COLORS.dark,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },
  clearText: {
    color: COLORS.blue,
    fontSize: 11,
    fontWeight: '800',
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F1F5F9',
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  filterButtonActive: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  filterText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
  },
  filterTextActive: {
    color: COLORS.white,
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 12,
  },
  mutedText: {
    color: COLORS.muted,
    fontSize: 11,
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 24,
    marginBottom: 15,
  },
  emptyIcon: {
    fontSize: 36,
    color: COLORS.blue,
    marginBottom: 8,
  },
  emptyTitle: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },
  errorBox: {
    backgroundColor: COLORS.redBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 17,
    gap: 12,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    color: COLORS.muted,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 20,
    marginBottom: 12,
  },
});
