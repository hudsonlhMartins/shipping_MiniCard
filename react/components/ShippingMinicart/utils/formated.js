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
  }
}
