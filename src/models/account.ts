import {
	Collection,
	Entity,
	OneToMany,
	OneToOne,
	PrimaryKey,
	Property,
} from '@mikro-orm/core';
import { SignInProviderEnum } from 'src/types/enums/sign-in-provider';
import { TimezoneEnum } from 'src/types/enums/timezone';
import { ConfigEntity } from './config';
import { SignInProviderEntity } from './sign-in-provider';

@Entity()
export class AccountEntity {
	@PrimaryKey({ type: 'char(16)' })
	id!: string;

	@Property({ type: 'varchar(150)' })
	email!: string;

	@Property({ type: 'varchar(25)' })
	phone!: string;

	@Property({ type: 'timestamp' })
	createdAt = new Date();

	@OneToOne()
	config!: ConfigEntity;

	@OneToMany({ mappedBy: 'accountId' })
	signInProviders = new Collection<SignInProviderEntity>(this);
}

/**
 *
 *
 * Repository
 *
 *
 */

export interface CreateWithEmail {
	email: string;
	timezone: TimezoneEnum;
}
export interface CreateWithPhone {
	phone: string;
	timezone: TimezoneEnum;
}
export interface CreateWithGoogle {
	email: string;
	timezone: TimezoneEnum;
	google: {
		id: string;
		accessToken: string;
		refreshToken: string;
		expiresAt: Date;
	};
}

export type CreateInput = CreateWithEmail | CreateWithPhone | CreateWithGoogle;

export interface GetByIdInput {
	id: string;
}

export interface GetByEmailInput {
	email: string;
}

export interface GetByPhoneInput {
	phone: string;
}

export interface GetByProviderInput {
	providerId: string;
	provider: SignInProviderEnum;
}

export interface GetManyByProviderInput {
	providerId: string;
	provider: SignInProviderEnum;
	email?: string;
}

export interface UpdateProviderInput {
	accountId: string;
	provider: SignInProviderEnum;
	providerId: string;
	accessToken: string;
	refreshToken: string;
	expiresAt: Date;
}

export abstract class AccountRepository {
	abstract create(i: CreateInput): Promise<AccountEntity>;

	abstract getById(i: GetByIdInput): Promise<AccountEntity | undefined>;

	abstract getByEmail(i: GetByEmailInput): Promise<AccountEntity | undefined>;

	abstract getByPhone(i: GetByPhoneInput): Promise<AccountEntity | undefined>;

	abstract getByProvider(
		i: GetByProviderInput,
	): Promise<AccountEntity | undefined>;

	// Get by provider information (id or email)
	abstract getManyByProvider(
		i: GetManyByProviderInput,
	): Promise<Array<AccountEntity>>;

	abstract updateGoogle(i: UpdateProviderInput): Promise<void>;
}

/**
 *
 *
 * Usecase
 *
 *
 */

export interface AuthOutput {
	refreshToken: string;
	accessToken: string;
	expiresAt: string;
	isFirstAccess?: true;
}

export interface RefreshOutput {
	accessToken: string;
	expiresAt: string;
}

export interface CreateWith3rdPartyProviderInput {
	code: string;
	originUrl: string;
	timezone: TimezoneEnum;
}

export interface CreateWithEmailProviderInput {
	email: string;
	timezone: TimezoneEnum;
}

export interface CreateWithPhoneProviderInput {
	phone: string;
	timezone: TimezoneEnum;
}

export interface ExchangeCodeInput {
	accountId: string;
	code: string;
}

export interface IamInput {
	id?: string;
}

export interface RefreshTokenInput {
	refreshToken: string;
}

export interface IamOutput {
	id: string;
	googleId?: string;
}

export interface AccountUseCase {
	createFromGoogleProvider: (
		i: CreateWith3rdPartyProviderInput,
	) => Promise<AuthOutput>;

	createFromEmailProvider: (i: CreateWithEmailProviderInput) => Promise<void>;

	createFromPhoneProvider: (i: CreateWithPhoneProviderInput) => Promise<void>;

	exchangeCode: (i: ExchangeCodeInput) => Promise<AuthOutput>;

	refreshToken: (i: RefreshTokenInput) => Promise<RefreshOutput>;

	iam: (i: IamInput) => Promise<IamOutput>;
}