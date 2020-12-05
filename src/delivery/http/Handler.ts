import { Request, Response, Router } from "express";
import Repository from "../../repository/repository";
import Usecases from "../../usecases/usecases";
import { schema } from "../../schema/ProductSchema";
import {
  isPalindrome,
  isIdSize,
  applyDiscount,
  invalidCharacterSize,
} from "../../utils/utils.functions";

class Handler {
  router: Router;

  constructor() {
    this.router = Router();
    this.routes();
  }

  async searchProduct(req: Request, res: Response) {
    // query search
    const query: any = req.query.query;
    // return res.status(200).json({ query })
    let productDiscount: number = 0;

    if(isPalindrome(query)) {
      productDiscount = 20
    }

    const repository = new Repository();
    const use_case = new Usecases(repository);

    // Check if string isnt empty
    // emptySearch(res, query);
    invalidCharacterSize(res, query);

    if (isIdSize(query)) {
      // Search by Id if it matches ID Size
      const response = await use_case.getProduct(query);
      if (Object.keys(response).length === 0)
        return res.status(404).json({ message: "not found", products: [] });
      return res.status(200).json({ products: [response] });
    } else {
      // Search query on all products columns
      const products = await use_case.searchProducts(query);
      if (products.length === 0) return res.status(404).json({ products: [] });
      return res
        .status(200)
        .json({ products: applyDiscount(productDiscount, products), message: "results" });
    }
  }

  async getProducts(req: Request, res: Response) {
    const repository = new Repository();
    const use_case = new Usecases(repository);
    const products = await use_case.getProducts();
    return res.send(products);
  }

  async getProduct(req: Request, res: Response) {
    const repository = new Repository();
    const use_case = new Usecases(repository);
    const { id } = req.params;

    const product = await use_case.getProduct(id);
    if (Object.keys(product).length > 0)
      return res.status(200).json({ message: "success" });
    return res.status(400).json({ message: "bad request" });
  }

  async createProduct(req: Request, res: Response) {
    try {
      const repository = new Repository();
      const use_case = new Usecases(repository);

      const value = await schema.validateAsync(req.body);
      if (!value)
        return res.status(400).json({ message: "invalid json schema" });

      const created = use_case.createProduct(value);
      if (created) return res.status(200).json({ message: "success" });
      return res.status(400).json({ message: "bad request" });
    } catch (err) {
      return res
        .status(400)
        .json({ message: "bad request", error: err.message });
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const repository = new Repository();
      const use_case = new Usecases(repository);
      const { id } = req.params;

      const value = await schema.validateAsync(req.body);
      if (!value)
        return res.status(400).json({ message: "invalid json schema" });
      const created = use_case.updateProduct(id, value);

      if (created) {
        return res.status(200).json({ message: "success" });
      }
    } catch (err) {
      return res
        .status(400)
        .json({ message: "bad request", error: err.message });
    }
  }

  async deleteProduct(req: Request, res: Response) {
    const repository = new Repository();
    const use_case = new Usecases(repository);
    const { id } = req.params;

    const deleted = await use_case.deleteProduct(id);

    if (deleted) return res.status(200).json({ message: "success" });
    return res.status(400).json({ message: "bad request" });
  }

  routes() {
    this.router.get("/all/", this.getProducts);
    this.router.get("/view/:id", this.getProduct);
    this.router.post("/create/", this.createProduct);
    this.router.delete("/delete/:id", this.deleteProduct);
    this.router.put("/update/:id", this.updateProduct);
    this.router.get("/search/", this.searchProduct);
  }
}

const handler = new Handler();

export default handler.router;
