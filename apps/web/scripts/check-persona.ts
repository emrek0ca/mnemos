
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const persona = await prisma.persona.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { conversations: true }
    });

    if (!persona) {
        console.log('No persona found.');
        return;
    }

    console.log('Persona Found:', persona.name);
    console.log('Identity Memory (Raw):', persona.identityMemory);

    // Parse if JSON
    try {
        if (persona.identityMemory) {
            const parsed = JSON.parse(persona.identityMemory);
            console.log('--- IDENTITY CORE ---');
            console.log(JSON.stringify(parsed, null, 2));
        }
    } catch (e) {
        console.log('Could not parse identity memory');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
