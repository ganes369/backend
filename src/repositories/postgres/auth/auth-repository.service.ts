import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
	CreateInput,
	GetManyByProviderInput,
	GetByEmailInput,
	GetByProviderInput,
	GetByPhoneInput,
	CreateWithGoogle,
	CreateWithPhone,
	CreateWithEmail,
	UpdateProviderInput,
	GetManyByProviderOutput,
} from 'src/models/auth';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { InjectRepository, Repository } from '..';
import { Account, Prisma, SignInProviderEnum } from '@prisma/client';
import { AuthRepository } from 'src/models/auth';

@Injectable()
export class AuthRepositoryService extends AuthRepository {
	constructor(
		@InjectRepository('account')
		private readonly accountRepository: Repository<'account'>,
		@InjectRepository('signInProvider')
		private readonly signInProviderRepository: Repository<'signInProvider'>,

		private readonly idAdapter: UIDAdapter,
	) {
		super();
	}

	async create(i: CreateInput): Promise<Account> {
		const accountId = this.idAdapter.gen();

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		//@ts-ignore
		const baseAccount: Prisma.AccountCreateArgs['data'] = {
			id: accountId,
			config: {
				create: {
					accountId,
					timezone: i.timezone,
				},
			},
		};

		const iAsGoogle = i as CreateWithGoogle;
		if (iAsGoogle.google) {
			return this.accountRepository.create({
				data: {
					...baseAccount,
					email: iAsGoogle.email,
					signInProviders: {
						create: {
							provider: SignInProviderEnum.GOOGLE,
							providerId: iAsGoogle.google.id,
							accessToken: iAsGoogle.google.accessToken,
							refreshToken: iAsGoogle.google.refreshToken,
							expiresAt: iAsGoogle.google.expiresAt,
						},
					},
				},
			});
		}

		const iAsPhone = i as CreateWithPhone;
		if (iAsPhone.phone) {
			return this.accountRepository.create({
				data: {
					...baseAccount,
					phone: iAsPhone.phone,
				},
			});
		}

		const iAsEmail = i as CreateWithEmail;
		if (iAsEmail.email) {
			return this.accountRepository.create({
				data: {
					...baseAccount,
					email: iAsEmail.email,
				},
			});
		}

		throw new InternalServerErrorException('Invalid user creation method');
	}

	async getByEmail({ email }: GetByEmailInput): Promise<undefined | Account> {
		return this.accountRepository.findUnique({
			where: {
				email,
			},
		});
	}

	async getByPhone({ phone }: GetByPhoneInput): Promise<undefined | Account> {
		return this.accountRepository.findUnique({
			where: {
				phone,
			},
		});
	}

	async getByProvider({
		provider,
		providerId,
	}: GetByProviderInput): Promise<undefined | Account> {
		return this.accountRepository.findFirst({
			where: {
				signInProviders: {
					every: {
						provider,
						providerId,
					},
				},
			},
		});
	}

	async getManyByProvider({
		provider,
		providerId,
		email,
	}: GetManyByProviderInput): Promise<GetManyByProviderOutput> {
		return this.accountRepository.findMany({
			include: {
				signInProviders: true,
			},
			where: {
				OR: [
					{
						SignInProvider: {
							every: {
								provider,
								providerId,
							},
						},
					},
					email
						? {
								email,
						  }
						: undefined,
				].filter(Boolean),
			},
		});
	}

	async updateProvider({
		accountId,
		provider,
		providerId,
		accessToken,
		refreshToken,
		expiresAt,
	}: UpdateProviderInput): Promise<void> {
		await this.signInProviderRepository.upsert({
			where: {
				accountId_provider_providerId: {
					accountId,
					provider,
					providerId,
				},
			},
			create: {
				accountId,
				provider,
				providerId,
				accessToken,
				refreshToken,
				expiresAt,
			},
			update: {
				accountId,
				provider,
				providerId,
				accessToken,
				refreshToken,
				expiresAt,
			},
		});
	}
}