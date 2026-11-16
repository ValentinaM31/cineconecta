# Catálogo relacional de Oracle

## Tablas y campos del anexo

Todos los campos de la figura 1 del enunciado son obligatorios.

| Tabla | Datos que registra | Campos y tipos |
| --- | --- | --- |
| `ACCOUNTS` | Cuentas de clientes | `accountId INTEGER`, `fullName VARCHAR2(150)`, `email VARCHAR2(254)`, `passwordHash VARCHAR2(255)`, `createdAt TIMESTAMP` |
| `PROFILES` | Perfiles por cuenta | `profileId INTEGER`, `accountId INTEGER`, `name VARCHAR2(60)`, `maxAgeRating INTEGER`, `isActive CHAR(1)` |
| `PLANS` | Planes, precios en COP y cupos | `planId INTEGER`, `name VARCHAR2(60)`, `price NUMBER(12,2)`, `maxProfiles INTEGER` |
| `SUBSCRIPTIONS` | Historial de suscripciones | `subscriptionId INTEGER`, `accountId INTEGER`, `planId INTEGER`, `startsAt TIMESTAMP`, `endsAt TIMESTAMP` |
| `PAYMENTS` | Pagos aprobados | `paymentId INTEGER`, `subscriptionId INTEGER`, `paidAt TIMESTAMP`, `amount NUMBER(12,2)`, `reference VARCHAR2(100)` |

## Claves, restricciones e índices del anexo

| Tabla | Clave primaria | Claves foráneas | Unicidad adicional |
| --- | --- | --- | --- |
| `ACCOUNTS` | `pk_accounts (accountId)` | Ninguna | Índice `ux_accounts_email_ci` sobre `LOWER(email)`. |
| `PROFILES` | `pk_profiles (profileId)` | `fk_profiles_account (accountId)` a `ACCOUNTS`. | Índice `ux_profiles_name_ci` sobre `(accountId, LOWER(name))`. |
| `PLANS` | `pk_plans (planId)` | Ninguna | `uq_plans_name (name)`. |
| `SUBSCRIPTIONS` | `pk_subscriptions (subscriptionId)` | `fk_subs_account (accountId)` a `ACCOUNTS` y `fk_subs_plan (planId)` a `PLANS`. | Ninguna |
| `PAYMENTS` | `pk_payments (paymentId)` | `fk_payments_subscription (subscriptionId)` a `SUBSCRIPTIONS`. | `uq_payments_subscription (subscriptionId)` y `uq_payments_reference (reference)`. |

## Reglas de negocio

- `uq_payments_subscription` permite un solo pago por suscripción. La transacción de contratación inserta la suscripción y su pago aprobado antes de confirmar ambos registros.
- Una suscripción dura 30 días y está vigente cuando `startsAt <= instante AND instante < endsAt`. La contratación se coordina por cuenta para verificar vigencia y cupo sin crear períodos superpuestos. Las altas y reactivaciones de perfiles se coordinan sobre la misma cuenta para respetar el máximo del plan.
- Desactivar un perfil conserva su identificador y sus referencias en MongoDB.

## Índice propuesto

`SUBSCRIPTIONS (accountId, startsAt)` es candidato para consultar el historial y buscar una suscripción vigente por cuenta. La condición sobre `endsAt` verifica cuándo termina el período. La comparación de planes y tiempos de ejecución se hará con el mismo volumen de datos y la misma consulta antes y después de crear el índice.
