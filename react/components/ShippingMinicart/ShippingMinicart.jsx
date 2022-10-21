import react, { useState, useEffect, useMemo } from 'react';
import { OrderForm } from 'vtex.order-manager'
import style from './style.css'
import useDebounce from './utils/useDebounce';
import { canUseDOM } from 'vtex.render-runtime'
import { Spinner } from 'vtex.styleguide'
import { useCssHandles } from 'vtex.css-handles'
import { CSS_HANDLES } from './utils/cssHandles'

import { formated } from './utils/formated'
import { api } from './utils/api'


const ShippingMinicart = () => {
    const [cep, setCep] = useState('')
    const [address, setAddress] = useState({})
    //const [itensCart, setItensCart] = useState([])
    const [hasError, setHasError] = useState(false)
    const [existCep, setExistCep] = useState(false)

    const [orderFormIdSave, setOrderFormIdSave] = useState('')

    const [loading, setLoading] = useState(false)

    const { useOrderForm } = OrderForm
    const { orderForm, setOrderForm } = useOrderForm()

    const { handles } = useCssHandles(CSS_HANDLES)

    const getItensOrderForm = () => {
        const itensCart = []
        orderForm.items.forEach(item => {
            const { id, quantity, seller } = item
            const data = { id, quantity, seller }
            itensCart.push(data)
            console.log('itensCart ==> ', data)
        })

        return itensCart
    }

    const getApi = async () => {
        const itensCart = getItensOrderForm()
        setLoading(true)
        const res = await api.simulationCep(itensCart, cep)

        let priceSum = res?.logisticsInfo?.reduce((acc, curr) => {
            return acc + curr.slas[0].price
        }, 0)

        const newPrice = formated.formatedPrice(priceSum)

        const dataFormated = {
            'name': res?.logisticsInfo[0]?.slas[0]?.name,
            'priceFormated': newPrice,
            'days': res?.logisticsInfo[0]?.slas[0]?.shippingEstimate?.replace('bd', ''),
            'cep': res?.postalCode
        }
        console.log('res.logisticsInfo[0].slas ===> ', res.logisticsInfo[0].slas)
        setAddress(dataFormated)
        saveOrderForm()

    }


    const saveOrderForm = () => {
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

        api.postApiShipping(url, data).then(res => res.json()).then(data => {
            console.log('resultado do seveOrder ==> ', data)
            setExistCep(true)
            setOrderFormIdSave(data?.orderFormId)
            setLoading(false)
        })
    }

    const removeCep = async () => {
        const id = orderForm?.id
        const url = `/api/checkout/pub/orderForm/${id}/attachments/shippingData`
        setLoading(true)
        const data = {
            selectedAddresses: null
        }

        api.postApiShipping(url, data).then((data) => {
            setExistCep(false)
            setHasError(false)
            setAddress({})
            setCep('')
            setLoading(false)
        })
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


    const getAddress = async () => {
        const address = orderForm?.shipping?.deliveryOptions
        const cep = orderForm?.shipping?.selectedAddress?.postalCode
        setLoading(true)

        const addressFilter = formated.getMenorPrice(address)

        const addressFormated = formated.formatedAddress(addressFilter)
        console.log('addressFormated ==> ', addressFormated)
        if (addressFormated) {
            addressFormated.cep = cep
            setAddress(addressFormated)
            setExistCep(true)
            setLoading(false)
        } else {
            await removeCep()
            setAddress({})
            setExistCep(false)
            setCep('')
            setLoading(false)
        }
    }

    useEffect(() => {
        console.log('orerfOmr ==> ', orderForm)
        const cepOrder = orderForm?.shipping?.selectedAddress
        console.log('carregou')

        if (!cepOrder) return false

        console.log('são iguais os oreder ==> ', orderForm?.id == orderFormIdSave)

        if (orderForm?.id != orderFormIdSave && orderFormIdSave.length > 0) {
            console.log('entrou aqui')
            setAddress({})
            setCep('')
            setExistCep(false)
            return false
        }

        setHasError(false)
        getAddress()


    }, [])

    return (
        canUseDOM ? (
            <>
                {!loading ? (

                    <div className={`${handles.container_minicart}`}>
                        <div className={`${handles.content_minicart} ${style.container_shipping}`}>
                            {existCep ? (
                                <div className={`${handles.container_cep_save} ${style.container_cep_save}`}>
                                    <div className={`${handles.content_cep} ${style.content_cep}`}>
                                        <span>
                                            Cep:
                                        </span>
                                        <span className={`${handles.number_cep}`}>
                                            {cep.length ? cep : address.cep}
                                        </span>
                                    </div>

                                    <span onClick={removeCep} className={`${handles.btn_limpa} ${style.btn_limpa}`}>
                                        <i>
                                            <svg className={`${handles.icon_limpa}`} stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"></path></svg>
                                        </i>
                                    </span>
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
                                <div className={`${style.content_shipping} ${handles.container_price}`}>
                                    <span className={`${style.shipping_days} ${handles.content_days}`}> em até {address.days} {Number(address.days) > 1 ? 'dias' : 'dia'}</span>
                                    <sapn className={`${style.shipping_price} ${handles.content_price}`}>{address.priceFormated == '0,00' ? 'grátis' : 'R$ ' + address.priceFormated}</sapn>
                                </div>
                            )}

                        </div>

                    </div>
                ) : (
                    <div className={`${style.container_shipping}`}>
                        <Spinner className={style.spinner} color="currentColor" size={20} />
                    </div>
                )}
            </>

        ) : (
            <div className={`${style.container_shipping}`}>
                <Spinner className={style.spinner} color="currentColor" size={20} />
            </div>
        )


    )
}

export default ShippingMinicart