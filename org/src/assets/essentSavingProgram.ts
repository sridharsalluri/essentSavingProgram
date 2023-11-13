import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

export const products = [
  {
    id: 'solar',
    title: 'Solar Panel',
    description: 'Super duper Essent solar panel',
    stock: 10,
    price: 750,
  },
  {
    id: 'insulation',
    title: 'Insulation',
    description: 'Cavity wall insulation',
    stock: 10,
    price: 2500,
  },
  {
    id: 'heatpump',
    title: 'Awesome Heatpump',
    description: 'Hybrid heat pump',
    stock: 3,
    price: 5000,
  },
];

interface Account {
  id: string;
  name: string;
  balance: number;
  latestPurchaseDay: number;
}

const accounts: Account[] = [];

interface Purchase {
  accountId: string;
  productId: string;
  simulatedDay: number;
}

const purchases: Purchase[] = [];

let interestRate = 0.08;

app.post('/accounts', (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Invalid Input' });
    }

    const newAccount: Account = {
      id: uuidv4(),
      name,
      balance: 0,
      latestPurchaseDay: 0,
    };

    accounts.push(newAccount);

    return res.status(200).json(newAccount);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/accounts', (req: Request, res: Response) => {
  try {
    const allAccounts = accounts.map(({id, name, balance}) => ({id, name, balance}));
    return res.status(201).json(allAccounts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/accounts/:accountId', (req: Request, res: Response) => {
  try {
    const accountId = req.params.accountId;
    const account = accounts.find((acc) => acc.id === accountId);

    if (!account) {
      return res.status(404).json({ error: 'Not Found' });
    }

    return res.status(200).json(account);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/accounts/:accountId/deposits', (req: Request, res: Response) => {
  try {
    const accountId = req.params.accountId;
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid Input' });
    }

    const account = accounts.find((acc) => acc.id === accountId);

    if (!account) {
      return res.status(404).json({ error: 'Not Found' });
    }

    account.balance += amount;

    return res.status(201).json({
      id: uuidv4(),
      name: account.name,
      balance: account.balance,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/accounts/:accountId/purchases', (req: Request, res: Response) => {
  try {
    const accountId = req.params.accountId;
    const { productId } = req.body;
    const simulatedDay = parseInt(req.get('Simulated-Day') || '0', 10);

    const account = accounts.find((acc) => acc.id === accountId);
    const product = products.find((prod) => prod.id === productId);
    const latestPurchaseDay = account ? account.latestPurchaseDay : -1;

    if (!account || !product) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    if (simulatedDay < latestPurchaseDay) {
      return res.status(400).json({ error: 'Simulated day illegal' });
    }

    if (product.stock <= 0 || account.balance < product.price) {
      return res.status(409).json({ error: 'Not enough stock or funds' });
    }

    product.stock--;
    account.balance -= product.price;
    account.latestPurchaseDay = simulatedDay;
    purchases.push({ accountId, productId, simulatedDay });

    return res.status(201).send('Success');
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/products', (req: Request, res: Response) => {
  try {
    const { title, description, price, stock } = req.body;

    if (!title || !description || isNaN(price) || isNaN(stock) || price <= 0 || stock <= 0) {
      return res.status(400).json({ error: 'Invalid Input' });
    }

    const newProduct = {
      id: uuidv4(),
      title,
      description,
      price,
      stock,
    };

    products.push(newProduct);

    return res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/products', (req: Request, res: Response) => {
  try {
    const allProducts = products.map(({id, title, description, stock, price}) => ({id, title, description, stock, price}));
    return res.status(200).json({'List of products as defined above, including inventories, so': allProducts});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/products/:productId', (req: Request, res: Response) => {
  try {
    const productId = req.params.productId;
    const product = products.find((prod) => prod.id === productId);

    if (!product) {
      return res.status(404).json({ error: 'Not Found' });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/interest', (req: Request, res: Response) => {
  try {
    const { rate } = req.body;

    if (!rate || isNaN(rate) || rate <= 0) {
      return res.status(400).json({ error: 'Invalid Input' });
    }

    interestRate = rate;

    return res.status(200).send('Success');
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
