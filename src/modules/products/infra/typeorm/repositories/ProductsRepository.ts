import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: { name },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const foundProducts = await this.ormRepository.findByIds(products);

    return foundProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productIds = products.map(product => product.id);

    const foundAllProducts = await this.ormRepository.find({
      id: In(productIds),
    });

    const updatedProducts = foundAllProducts.map(product => {
      const foundProduct = products.find(
        productFound => productFound.id === product.id,
      );

      if (foundProduct) {
        return {
          ...product,
          quantity: product.quantity - foundProduct.quantity,
        };
      }

      return product;
    });

    await this.ormRepository.save(updatedProducts);

    return updatedProducts;
  }
}

export default ProductsRepository;
