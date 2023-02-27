import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const main = async () => {
    await prisma.user.deleteMany({});
    await prisma.user.create({
        data: {
            email: 'jondog@prisma.com',
            hashedPassword: '258963147',
            username: 'jondog',
            library: {
                create: {
                    data: "{'all': ['dasdasda', 'ewqedas', 'vcxvdfd']}"
                }
            }
        }
    });
    await prisma.user.create({
        data: {
            email: 'pawndog@prisma.com',
            hashedPassword: '963741582',
            username: 'pawndog',
            library: {
                create: {
                    data: "{'all': ['eowqeo', 'vcxvvcx', 'dlasdl']}"
                }
            }
        }
    });
    await prisma.user.create({
        data: {
            email: 'lawdog@prisma.com',
            hashedPassword: '741862358',
            username: 'lawdog',
            library: {
                create: {
                    data: "{'all': ['ppeowq', 'zzasas', 'vcxvdfd']}"
                }
            }
        }
    });
};
main().then(() => {
    console.log("Data seeded...");
});
