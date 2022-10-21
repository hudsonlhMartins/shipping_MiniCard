export const api = {
  postApiShipping: async (url, data) => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    })
    return res
  },

  simulationCep: async (itensCart, cep) => {

    const url = `/api/checkout/pub/orderForms/simulation/?sc=1`

    let data = {
      'items': itensCart,
      'postalCode': cep,
      'country': 'BRA',
    };

    let request = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(data)
    })
    const res = await request.json()

    return res
  }

}
