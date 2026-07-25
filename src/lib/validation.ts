import { z } from "zod";
import { eventConfig } from "@/config/event";

/**
 * Validación del payload de inscripción. El frontend valida lo mismo a mano
 * (la landing es HTML estático), pero esta es la validación que manda.
 * Nótese que NO existe ningún campo de precio: el precio se calcula solo
 * en el servidor a partir de src/config/event.ts.
 */
export const registrationSchema = z.object({
  firstName: z
    .string({ required_error: "El nombre es obligatorio." })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(80, "El nombre es demasiado largo."),
  lastName: z
    .string({ required_error: "El apellido es obligatorio." })
    .trim()
    .min(2, "El apellido debe tener al menos 2 caracteres.")
    .max(80, "El apellido es demasiado largo."),
  email: z
    .string({ required_error: "El email es obligatorio." })
    .trim()
    .toLowerCase()
    .email("Ingresá un email válido.")
    .max(160, "El email es demasiado largo."),
  phone: z
    .string({ required_error: "El WhatsApp es obligatorio." })
    .trim()
    .regex(/^\+?[\d\s\-().]{8,20}$/, "Ingresá un número de WhatsApp válido."),
  documentNumber: z
    .string()
    .trim()
    .regex(/^\d{7,9}$/, "El DNI debe tener entre 7 y 9 dígitos.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  quantity: z.coerce
    .number({ invalid_type_error: "Cantidad inválida." })
    .int("Cantidad inválida.")
    .min(1, "Elegí al menos 1 entrada.")
    .max(
      eventConfig.maxTicketsPerPurchase,
      `Máximo ${eventConfig.maxTicketsPerPurchase} entradas por compra.`,
    ),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Tenés que aceptar los términos para continuar." }),
  }),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
