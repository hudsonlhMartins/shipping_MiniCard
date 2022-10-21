export const formated = {
  getMenorPrice: (address) => {

    let addressFilter = address.reduce((prev, curr) => {
      if (prev) {
        if (prev.price <= curr.price) {
          return prev
        } else {
          return curr
        }
      }
    }, {})

    return addressFilter
  },

  formatedPrice: (price) => {
    const priceFormated = price * 0.01
    return priceFormated.toFixed(2).replace('.', ',')
  },

  formatedAddress: (data) => {
    if (data.estimate) {
      const estimate = Number(data.estimate.replace('bd', ''))
      const dataFormated = {
        days: estimate,
        priceFormated: formated.formatedPrice(data.price)
      }
      return dataFormated
    }
  }


}