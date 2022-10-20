import react, { useState, useEffect, useMemo } from 'react';
import { OrderForm } from 'vtex.order-manager'
import style from './style.css'
import useDebounce from './utils/useDebounce';
import { canUseDOM } from 'vtex.render-runtime'
import { Spinner } from 'vtex.styleguide'
import { FormattedPrice } from 'vtex.formatted-price'



const ShippingMinicart = () => {
    const [cep, setCep] = useState('')
    const [address, setAddress] = useState({})
    const [itensCart, setItensCart] = useState([])
    const [hasError, setHasError] = useState(false)
    const [existCep, setExistCep] = useState(false)

    const { useOrderForm } = OrderForm
    const { orderForm, setOrderForm } = useOrderForm()

    const getItensOrderForm = () => {
        orderForm.items.forEach(item => {
            const { id, quantity, seller } = item
            const data = { id, quantity, seller }
            itensCart.push(data)
            setItensCart(itensCart)
        })
    }

    const formatedPrice = (price) => {
        const priceFormated = price * 0.01
        return priceFormated.toFixed(2).replace('.', ',')
    }


    const getApi = async () => {
        const url = `/api/checkout/pub/orderForms/simulation/?sc=1`
        getItensOrderForm()

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

        //console.log('dataformated ===> ', res)

        let priceSum = res.logisticsInfo.reduce((acc, curr) => {
            return acc + curr.slas[0].listPrice
        }, 0)

        const newPrice = formatedPrice(priceSum)

        const dataFormated = {
            'name': res.logisticsInfo[0].slas[0].name,
            'price': res.logisticsInfo[0].slas[0].listPrice,
            'priceFormated': newPrice,
            'days': res.logisticsInfo[0].slas[0].shippingEstimate.replace('bd', ''),
            'cep': res.postalCode
        }
        //console.log('dataFormated ===> ', dataFormated)
        setAddress(dataFormated)
        saveOrderForm()
    }



    const postApiShipping = async (url, data) => {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        })
        return res
    }

    const saveOrderForm = () => {
        // /api/checkout/pub/orderForm/c97cf811fb0a443786bdc78d138ce74c/attachments/shippingData
        // /api/checkout/pub/orderForm/13123/attachments/shippingData
        const id = orderForm?.id
        const url = `/api/checkout/pub/orderForm/${id}/attachments/shippingData`
        const data = {
            selectedAddresses: [
                {
                    "addressType": "Residential",
                    "postalCode": cep,
                    "country": "BRA"
                }
            ]
        }

        postApiShipping(url, data).then(res => res.json()).then(data => {
            //console.log('resultado do seveOrder ==> ', data)
            setExistCep(true)
        })
    }

    const removeCep = () => {
        const id = orderForm?.id
        const url = `/api/checkout/pub/orderForm/${id}/attachments/shippingData`

        const data = {
            selectedAddresses: null
        }

        postApiShipping(url, data).then((data) => {
            setExistCep(false)
            setHasError(false)
        })

        setTimeout(() => {
            setExistCep(false)
            setAddress({})
        }, 800)
        // setHasError(false)
    }



    const debounceClick = useDebounce(getApi, 500)
    const handleSubmitForm = async (e) => {
        e.preventDefault();
        if (cep.length < 8 || cep.length > 8) {
            setHasError(true)
            throw new Error('CEP inválido')
        }
        setHasError(false)
        debounceClick()

    }



    const formatedAddress = (data) => {
        const estimate = Number(data.estimate.replace('bd', ''))
        const dataFormated = {
            days: estimate,
            priceFormated: formatedPrice(data.price)
        }

        return dataFormated
    }

    const getAddress = () => {
        const address = orderForm?.shipping?.deliveryOptions
        const cep = orderForm?.shipping?.selectedAddress?.postalCode


        let addressFilter = address.reduce((prev, curr) => {
            if (prev) {
                if (prev.price <= curr.price) {
                    return prev
                } else {
                    return curr
                }
            }
        }, {})

        const addressFormated = formatedAddress(addressFilter)
        addressFormated.cep = cep

        console.log(addressFormated)
        setAddress(addressFormated)
    }

    useEffect(() => {
        // console.log('orerfOmr ==> ', orderForm?.shipping)
        const cepOrder = orderForm?.shipping?.selectedAddress

        if (!cepOrder) return false

        setHasError(false)
        getAddress()
        setExistCep(true)



    }, [])

    return (
        canUseDOM ? (
            <>
                <div className={style.container_shipping}>
                    {existCep ? (
                        <div>
                            <div>
                                <span>
                                    Cep:
                                </span>
                                <span>
                                    {cep.length ? cep : address.cep}
                                </span>
                            </div>

                            <span onClick={removeCep}>Limpa</span>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmitForm}>
                            <label htmlFor="shipping">frete</label>
                            <input className={style.input_shipping} id='shipping' type='text' max='8' min={'8'}
                                value={cep}
                                onChange={e => setCep(e.target.value)}
                                placeholder='calcula o prazo'
                            />
                            <button type='submit'>
                                <i>
                                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M869 487.8L491.2 159.9c-2.9-2.5-6.6-3.9-10.5-3.9h-88.5c-7.4 0-10.8 9.2-5.2 14l350.2 304H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h585.1L386.9 854c-5.6 4.9-2.2 14 5.2 14h91.5c1.9 0 3.8-.7 5.2-2L869 536.2a32.07 32.07 0 0 0 0-48.4z"></path></svg>
                                </i>
                            </button>
                        </form>

                    )}



                    {hasError && <div className={style.error}>CEP inválido</div>}
                    {address?.priceFormated && hasError == false && (
                        <div className={style.content_shipping}>
                            <span className={style.shipping_days}>em até {address.days} {Number(address.days) > 1 ? 'dias' : 'dia'}</span>
                            <sapn className={style.shipping_price}>{address.priceFormated}</sapn>
                        </div>
                    )}

                </div>

            </>

        ) : (
            <div className={`${style.container_shipping}`}>
                <Spinner className={style.spinner} color="currentColor" size={20} />
            </div>
        )


    )
}

export default ShippingMinicart