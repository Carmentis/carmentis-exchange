import * as z from 'zod';

export const ConfigSchema = z.object({
    control: z.object({
        port: z.number().positive().default(3000),
        storage: z.string().default('.control'),
        node_url: z.string(),
        private_key: z.object({
            sk: z.string().optional(),
            env: z.string().optional(),
            path: z.string().optional(),
        }),
        auth: z
            .object({
                jwt_secret: z.string().optional(),
                allowed_public_keys: z.array(z.string()).default([]),
            })
            .optional(),
        purchase: z.object({
            stancer: z.object({
                api_key: z.string(),
            }),
        }),
    }),
});

export type ConfigType = z.infer<typeof ConfigSchema>;
