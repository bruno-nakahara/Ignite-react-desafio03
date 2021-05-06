import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO  
      const findProductInCart = cart.find(productCart => productCart.id === productId)

      if(!findProductInCart) {
        const apiProduct = await api.get(`http://localhost:3333/products/${productId}`)
          .then(response => response.data)
        
        const addNewProduct: Product = {
            ...apiProduct,
            amount: 1,
          }
          
        setCart([...cart, addNewProduct])
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, addNewProduct]));
        return
      }
      
      const apiStock = await api.get(`http://localhost:3333/stock/${productId}`)
        .then(response => response.data)

      cart.map((product: Product) => {
        if (product.id === productId) {
          if (apiStock.amount > product.amount) {
            const otherItems = cart.filter(item => item.id != productId)

            const addItem = {
              ...product,
              amount: product.amount + 1
            }

            setCart([...otherItems, addItem])

            localStorage.setItem('@RocketShoes:cart', JSON.stringify([...otherItems, addItem]));

            return
          } else {
            toast.error('Quantidade solicitada fora de estoque');
            return
          }
        }
      })
            
    } catch (err) {
      // TODO
      toast.error("Erro na adição do produto")
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const findProduct = cart.find(product => product.id === productId)

      if (findProduct) {
        const deleteProduct = cart.filter(product => product.id !== productId)

        setCart(deleteProduct)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(deleteProduct));   
        return
      } else {
        throw new Error
      }
      
    } catch {
      // TODO
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if (amount <= 0) {
        return
      }

      const apiStock = await api.get<Stock>(`http://localhost:3333/stock/${productId}`)
        .then(response => response.data)

      if (amount > apiStock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }
      
      cart.map(async product => {
        if (product.id === productId) {
          const otherProducts = cart.filter(item => item.id != productId)

          const addItem = {
            ...product,
            amount
          }

          setCart([...otherProducts, addItem])
          
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...otherProducts, addItem])); 
          return
        }
      })
      
    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
