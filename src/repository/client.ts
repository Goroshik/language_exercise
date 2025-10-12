import { PrismaClient } from 'src/generated/prisma';
import { decrypt, encrypt } from 'src/utils/crypto';

const SECRET_KEY = '6d0e699d3a7744c9aa82dec1fa4ef1f3';
const tokenEncryptedFields = ['encryptedToken'];

class CustomPrismaClient {
  private readonly client: PrismaClient;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    this.client = new PrismaClient({ log: ['info'] }).$extends({
      query: {
        userToken: {
          findUnique: this.findDecryptMiddleware.bind(this),
          findUniqueOrThrow: this.findDecryptMiddleware.bind(this),
          findFirst: this.findDecryptMiddleware.bind(this),
          findFirstOrThrow: this.findDecryptMiddleware.bind(this),
          findMany: this.findDecryptMiddleware.bind(this),

          create: this.createUpdateEncryptMiddleware.bind(this),
          createMany: this.createUpdateEncryptMiddleware.bind(this),
          update: this.createUpdateEncryptMiddleware.bind(this),
          upsert: this.upsertEncryptMiddleware.bind(this)
        }
      }
    });
  }

  public get clientInstance() {
    return this.client;
  }

  public async disconnect() {
    return this.client.$disconnect();
  }

  private async findDecryptMiddleware<TResult extends Record<string, any>, TArgs>({
    args,
    query
  }: {
    args: TArgs;
    query: (args: TArgs) => Promise<TResult | TResult[] | null>;
  }): Promise<TResult | TResult[] | null> {
    const result = await query(args);

    if (!result) return result;
    else if (Array.isArray(result))
      return result.map(item => this.decryptQueryDataByKeys(item, tokenEncryptedFields));
    else return this.decryptQueryDataByKeys(result, tokenEncryptedFields);
  }

  private async createUpdateEncryptMiddleware<
    TResult,
    TData extends Record<string, any>,
    TArgs extends { data: TData | TData[] }
  >({ args, query }: { args: TArgs; query: (args: TArgs) => Promise<TResult> }): Promise<TResult> {
    let encryptedData: TData | TData[] | null = null;

    if (Array.isArray(args.data)) {
      encryptedData = args.data.map(data =>
        this.encryptQueryDataByKeys(data, tokenEncryptedFields)
      );
    } else {
      encryptedData = this.encryptQueryDataByKeys(args.data, tokenEncryptedFields);
    }

    return query({ ...args, data: encryptedData } as TArgs);
  }

  private async upsertEncryptMiddleware<
    TResult,
    TData extends Record<string, any>,
    TArgs extends { create: TData | TData[]; update: TData | TData[] }
  >({ args, query }: { args: TArgs; query: (args: TArgs) => Promise<TResult> }): Promise<TResult> {
    let encryptedUpdateData: TData | TData[] | null = null;
    let encryptedCreateData: TData | TData[] | null = null;

    if (Array.isArray(args.create)) {
      encryptedCreateData = args.create.map(data =>
        this.encryptQueryDataByKeys(data, tokenEncryptedFields)
      );
    } else {
      encryptedCreateData = this.encryptQueryDataByKeys(args.create, tokenEncryptedFields);
    }

    if (Array.isArray(args.update)) {
      encryptedUpdateData = args.update.map(data =>
        this.encryptQueryDataByKeys(data, tokenEncryptedFields)
      );
    } else {
      encryptedUpdateData = this.encryptQueryDataByKeys(args.update, tokenEncryptedFields);
    }

    return query({ ...args, create: encryptedCreateData, update: encryptedUpdateData } as TArgs);
  }

  private encryptQueryDataByKeys<T extends Record<string, any>>(data: T, keys: string[]): T {
    const result = { ...data };

    keys.forEach(key => {
      if (key in data && typeof data[key] === 'string' && data[key]) {
        (result as Record<string, any>)[key] = encrypt(data[key] as string, SECRET_KEY);
      }
    });

    return result;
  }

  private decryptQueryDataByKeys<T extends Record<string, any>>(data: T, keys: Array<string>): T {
    const result: T = { ...data };

    keys.forEach(key => {
      if (key in data && typeof data[key] === 'string' && data[key]) {
        (result as Record<string, any>)[key] = decrypt(data[key] as string, SECRET_KEY);
      }
    });

    return result;
  }
}

const customPrismaClient = new CustomPrismaClient();

export default {
  user: customPrismaClient.clientInstance.user,
  word: customPrismaClient.clientInstance.word,
  tag: customPrismaClient.clientInstance.tag,
  entityTag: customPrismaClient.clientInstance.entityTag,
  userToken: customPrismaClient.clientInstance.userToken,
  userSettings: customPrismaClient.clientInstance.userSettings,
  $disconnect: () => customPrismaClient.disconnect()
};
