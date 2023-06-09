import {PrismaClient} from '@prisma/client'
import express from 'express'
import dayjs from 'dayjs'

const prisma = new PrismaClient()
const app = express()
app.use(express.json())

app.get('/user', async(request, response) => {
    
    const users = await prisma.user.findMany({
        include: {
            pushings: true
        },
        orderBy: {
            name:  'asc'
        }
    })

    const charges = await prisma.pushing.findMany()

        const day = dayjs()
        charges.map(async (charge) => {
            const day_current = dayjs(charge.day_assin).set('date', day.date())
            const day_exp = dayjs(charge.day_venc)
            let count_day = day_current.date() - day_exp.date()
            console.log(count_day)

            await prisma.pushing.updateMany({
                where: {
                    id: charge.id
                },
                data: {
                    count_day: count_day
                }
            })

            if (count_day < 0){
                count_day +=  30
                await prisma.pushing.updateMany({
                    where: {
                        id: charge.id
                    },
                    data: {
                        count_day: count_day
                    }
                })
                
            } 

            count_day = 0
        })

        // const day_current = dayjs().set('date', day.date())
        // const day_exp = dayjs(charges.day_venc)
        // let count_day = day_current.date() - day_exp.date()
        // console.log(count_day)
    

    return response.status(200).json(users)
})

app.get('/user/pushning/:id', async (request, response) => {
    const {id} = request.params 

    const user = await prisma.user.findUnique({
        where: {
            id: id
        },
        include: {
            pushings: true
        }
    })

    return response.status(200).json(user)

})

app.get('/pushing/expired', async (request, response) => {

    const pushing = await prisma.pushing.findMany({
        where: {
            count_day: {
                gte: 30
            }
        },
        include: {
            user: true
        }
    })

    if (!pushing.length) {
        return response.json({message: 'Não há Alunos em debitos'})
    }

    return response.json(pushing)
})

// create users
app.post('/user', async (request, response) => {

    const { name, whatsapp} = request.body

    const user = await prisma.user.create({
        data: {
            name: name,
            whatsapp: whatsapp
        }
    })

    return response.status(201).json(user)
})


// create pushning
app.post('/pushing/:id', async (request, response) => {

    const {id} = request.params
    const {day_assin} = request.body

    const user = await prisma.user.findUnique({
        where: {
            id: id,
        }
    })

    if (!user){
        return response.status(401).json({message: 'Aluno não encontrado'})
    }

    if (day_assin <= 0 || day_assin > 31) {
        return response.status(401).json({message: "Dia Inválido."})
    }
    
    const DT_ASSIN = dayjs().set('date', day_assin).locale('pt-br')
    const DT_VENC = dayjs().set('M', (dayjs().month() + 1)).locale('pt-br').set('date', day_assin)

    console.log(DT_ASSIN.toDate(), DT_VENC.toDate())


    const pushing = await prisma.pushing.create({
        data: {
            day_assin: DT_ASSIN.toDate(),
            day_venc: DT_VENC.toDate(),
            userId: id
        }
    })

    return response.status(201).json(pushing)

})

app.get('/user/:userid/pushing/:pushingid', async (request, response) => {
    const {userid, pushingid} = request.params

    const user = await prisma.user.findUnique({
        where: {
            id: userid
        }
    })

    if (!user) {
        return response.status(400).json({message: 'Aluno inexistente'})
    }

     
    const charge = await prisma.pushing.findUnique({
        where: {
            id: pushingid
        },
        include: {
            user: true
        }
    })

    if (!charge) {
        return response.status(400).json({message: 'Assinatura inexistente'})
    } else if (charge){
        
        const day = dayjs()
        const day_current = dayjs(charge.day_assin).set('date', day.date())
        const day_exp = dayjs(charge.day_venc)
        let count_day = day_current.date() - day_exp.date()
        console.log(count_day)
        
            var rest_day = await prisma.pushing.findUnique({
                where: {
                    id: charge.id
                }
            })
            if (rest_day?.count_day === 30) {
                return response.json({message: 'Ops! assinatura do Aluno expirada'})
            }

            rest_day = await prisma.pushing.update({
            where: {
                id: charge.id
            },
            data: {
                count_day: count_day
            },
            
        })

        if (count_day === 0) {
            
            if (count_day === 0  && (day_current.month() + 1) === (day_exp.month() + 1)){
                await prisma.pushing.update({
                    where: {
                        id: charge.id
                    },
                    data: {
                        count_day: 30
                    }
                })
                return response.json({message: 'A assinatura do Aluno expira hoje'})
                
            }
          
        }
        else if (count_day < 0){
            count_day +=  30
            const push = await prisma.pushing.update({
                where: {
                    id: charge.id
                },
                data: {
                    count_day: count_day
                },
                include: {
                    user: true
                }
            })
            
            return response.status(200).json(push)
        }
        
        // console.log(day_exp.date())
        
    }
    return response.status(200).json(charge)

})

// update date
app.put('/renew/user/pushing/:puid', async (request, response) => {
    const {puid} = request.params
    const {day_assin} = request.body

    const pushing = await prisma.pushing.findUnique({
        where: {
            id: puid
        }
    })

    if (!pushing) {
        return response.json({message: 'Dados inválidos'})
    }


    const DT_ASSIN = dayjs().set('date', day_assin).locale('pt-br')
    const DT_VENC = dayjs().set('M', (dayjs().month() + 1)).locale('pt-br').set('date', day_assin)
    
    const renew = await prisma.pushing.update ({
        where: {
            id: puid,
        }, 
        data: {
            day_assin: DT_ASSIN.toDate(),
            day_venc: DT_VENC.toDate(),
            count_day: 0
        }
    })

    return response.status(201).json(renew)
    
})

app.delete('/user/:uid', async (request, response) => {
    const {uid} = request.params

    const user = await prisma.user.findUnique({
        where: {
            id: uid
        }
    })

    if (user) {
        await prisma.user.delete({
            where: {
                id: uid
            }
        })
    }
    else {
        return response.json({message: 'Usuário não existe'})
    }

    return response.status(200).json({message: 'Usuário delete com sucesso!'})
})



app.listen(3000, () => console.log('server is running'))



// const DT_ASSI = dayjs().set('date', 13)
// const DT_VENC = dayjs()

// console.log(DT_ASSI.month())
// console.log(DT_VENC.month())

// const day_current = DT_ASSI.date() - (DT_VENC.date() - 30)

// if (day_current >= 31) {
    
// }

// console.log(day_current)
