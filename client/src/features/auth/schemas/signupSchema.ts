import { z } from 'zod';

export const signUpSchema = z
	.object({
		firstName: z.string().trim().min(1, 'First name is required.'),
		lastName: z.string().trim().min(1, 'Last name is required.'),
		username: z
			.string()
			.trim()
			.min(1, 'Username is required.')
			.max(30, 'Username must be 30 characters or less.')
			,
		email: z.email('Enter a valid email address.'),
		phone: z
			.string()
			.trim()
			.min(1, 'Phone number is required.'),
		city: z.string().trim().min(1, 'City is required.'),
		neighborhood: z.string().trim().min(1, 'Neighborhood is required.'),
		password: z
			.string()
			.min(1, 'Password is required.'),
		confirmPassword: z.string().min(1, 'Please confirm your password.'),
		bio: z
			.string()
			.max(180, 'Bio must be 180 characters or less.')
			.optional()
			.or(z.literal('')),
		profilePicture: z
			.custom<FileList | null>((value) => value === null || value instanceof FileList)
			.optional(),
	})
	.refine((values) => values.password === values.confirmPassword, {
		path: ['confirmPassword'],
		message: 'Passwords do not match.',
	});

export type SignUpSchema = z.infer<typeof signUpSchema>;
