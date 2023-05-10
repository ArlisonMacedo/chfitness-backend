"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = __importDefault(require("express"));
const dayjs_1 = __importDefault(require("dayjs"));
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get('/user', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield prisma.user.findMany({
        include: {
            pushings: true
        },
        orderBy: {
            name: 'asc'
        }
    });
    const charges = yield prisma.pushing.findMany();
    const day = (0, dayjs_1.default)();
    charges.map((charge) => __awaiter(void 0, void 0, void 0, function* () {
        const day_current = (0, dayjs_1.default)(charge.day_assin).set('date', day.date());
        const day_exp = (0, dayjs_1.default)(charge.day_venc);
        let count_day = day_current.date() - day_exp.date();
        console.log(count_day);
        yield prisma.pushing.updateMany({
            where: {
                id: charge.id
            },
            data: {
                count_day: count_day
            }
        });
        if (count_day < 0) {
            count_day += 30;
            yield prisma.pushing.update({
                where: {
                    id: charge.id
                },
                data: {
                    count_day: count_day
                }
            });
        }
        count_day = 0;
    }));
    // const day_current = dayjs().set('date', day.date())
    // const day_exp = dayjs(charges.day_venc)
    // let count_day = day_current.date() - day_exp.date()
    // console.log(count_day)
    return response.status(200).json(users);
}));
app.get('/user/pushning/:id', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = request.params;
    const user = yield prisma.user.findUnique({
        where: {
            id: id
        },
        include: {
            pushings: true
        }
    });
    return response.status(200).json(user);
}));
app.get('/pushing/expired', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const pushing = yield prisma.pushing.findMany({
        where: {
            count_day: {
                gte: 30
            }
        },
        include: {
            user: true
        }
    });
    if (!pushing.length) {
        return response.json({ message: 'Não há Alunos em debitos' });
    }
    return response.json(pushing);
}));
// create users
app.post('/user', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, whatsapp } = request.body;
    const user = yield prisma.user.create({
        data: {
            name: name,
            whatsapp: whatsapp
        }
    });
    return response.status(201).json(user);
}));
// create pushning
app.post('/pushing/:id', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = request.params;
    const { day_assin } = request.body;
    const user = yield prisma.user.findUnique({
        where: {
            id: id,
        }
    });
    if (!user) {
        return response.status(401).json({ message: 'Aluno não encontrado' });
    }
    if (day_assin <= 0 || day_assin > 31) {
        return response.status(401).json({ message: "Dia Inválido." });
    }
    const DT_ASSIN = (0, dayjs_1.default)().set('date', day_assin).locale('pt-br');
    const DT_VENC = (0, dayjs_1.default)().set('M', ((0, dayjs_1.default)().month() + 1)).locale('pt-br').set('date', day_assin);
    console.log(DT_ASSIN.toDate(), DT_VENC.toDate());
    const pushing = yield prisma.pushing.create({
        data: {
            day_assin: DT_ASSIN.toDate(),
            day_venc: DT_VENC.toDate(),
            userId: id
        }
    });
    return response.status(201).json(pushing);
}));
app.get('/user/:userid/pushing/:pushingid', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { userid, pushingid } = request.params;
    const user = yield prisma.user.findUnique({
        where: {
            id: userid
        }
    });
    if (!user) {
        return response.status(400).json({ message: 'Aluno inexistente' });
    }
    const charge = yield prisma.pushing.findUnique({
        where: {
            id: pushingid
        },
        include: {
            user: true
        }
    });
    if (!charge) {
        return response.status(400).json({ message: 'Assinatura inexistente' });
    }
    else if (charge) {
        const day = (0, dayjs_1.default)();
        const day_current = (0, dayjs_1.default)(charge.day_assin).set('date', day.date());
        const day_exp = (0, dayjs_1.default)(charge.day_venc);
        let count_day = day_current.date() - day_exp.date();
        console.log(count_day);
        var rest_day = yield prisma.pushing.findUnique({
            where: {
                id: charge.id
            }
        });
        if ((rest_day === null || rest_day === void 0 ? void 0 : rest_day.count_day) === 30) {
            return response.json({ message: 'Ops! assinatura do Aluno expirada' });
        }
        rest_day = yield prisma.pushing.update({
            where: {
                id: charge.id
            },
            data: {
                count_day: count_day
            },
        });
        if (count_day === 0) {
            if (count_day === 0 && (day_current.month() + 1) === (day_exp.month() + 1)) {
                yield prisma.pushing.update({
                    where: {
                        id: charge.id
                    },
                    data: {
                        count_day: 30
                    }
                });
                return response.json({ message: 'A assinatura do Aluno expira hoje' });
            }
        }
        else if (count_day < 0) {
            count_day += 30;
            const push = yield prisma.pushing.update({
                where: {
                    id: charge.id
                },
                data: {
                    count_day: count_day
                },
                include: {
                    user: true
                }
            });
            return response.status(200).json(push);
        }
        // console.log(day_exp.date())
    }
    return response.status(200).json(charge);
}));
// update date
app.put('/renew/user/pushing/:puid', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { puid } = request.params;
    const { day_assin } = request.body;
    const pushing = yield prisma.pushing.findUnique({
        where: {
            id: puid
        }
    });
    if (!pushing) {
        return response.json({ message: 'Dados inválidos' });
    }
    const DT_ASSIN = (0, dayjs_1.default)().set('date', day_assin).locale('pt-br');
    const DT_VENC = (0, dayjs_1.default)().set('M', ((0, dayjs_1.default)().month() + 1)).locale('pt-br').set('date', day_assin);
    const renew = yield prisma.pushing.update({
        where: {
            id: puid,
        },
        data: {
            day_assin: DT_ASSIN.toDate(),
            day_venc: DT_VENC.toDate(),
            count_day: 0
        }
    });
    return response.status(201).json(renew);
}));
app.listen(3000, () => console.log('server is running'));
// const DT_ASSI = dayjs().set('date', 13)
// const DT_VENC = dayjs()
// console.log(DT_ASSI.month())
// console.log(DT_VENC.month())
// const day_current = DT_ASSI.date() - (DT_VENC.date() - 30)
// if (day_current >= 31) {
// }
// console.log(day_current)
