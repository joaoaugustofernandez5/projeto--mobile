const BASE_URL = 'http://10.137.11.6/api/sensor/status';

export const getSensores = async () => {
  try {
    const response = await fetch(`${BASE_URL}/listar`);
    const json = await response.json();
    return json.data || [];
  } catch (error) {
    console.error("Erro ao buscar sensores:", error);
    throw error;
  }
};

export const atualizarStatus = async (codigo, status) => {
  try {
    const response = await fetch(`${BASE_URL}/atualizar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ codigo, status }),
    });
    return await response.json();
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    throw error;
  }
};