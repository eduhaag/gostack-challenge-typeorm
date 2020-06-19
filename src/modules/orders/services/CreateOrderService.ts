import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Product from '@modules/products/infra/typeorm/entities/Product';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrderRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomerRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer does not exists');
    }

    const productsInStock = await this.productsRepository.findAllById(products);

    if (productsInStock.length !== products.length) {
      throw new AppError('Product does not exist');
    }

    const productList = [] as Product[];

    products.forEach(orderedProducts => {
      const currentStock = productsInStock.find(
        product => product.id === orderedProducts.id,
      );

      if (!currentStock) {
        throw new AppError('Product does not exist.');
      }

      if (orderedProducts.quantity > currentStock.quantity) {
        throw new AppError('Insuficient quantity');
      }

      productList.push({
        ...currentStock,
        quantity: orderedProducts.quantity,
      });
    });

    await this.productsRepository.updateQuantity(productList);

    const alteredProducts = productList.map(product => ({
      product_id: product.id,
      price: product.price,
      quantity: product.quantity,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: alteredProducts,
    });

    return order;
  }
}

export default CreateOrderService;
