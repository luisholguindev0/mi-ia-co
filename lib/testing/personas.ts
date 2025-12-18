/**
 * lib/testing/personas.ts
 * Define realistic user personas for E2E testing
 */

export interface Persona {
    id: string;
    name: string;
    phoneNumber: string;
    backstory: string;
    businessType: string;
    location: string;
    goals: string[];
    frustrationTriggers: string[];
    behavior: {
        patienceLevel: 'low' | 'medium' | 'high';
        pricesSensitivity: 'low' | 'medium' | 'high';
        trustLevel: 'low' | 'medium' | 'high';
        techSavvy: 'low' | 'medium' | 'high';
    };
    expectedOutcome: 'books' | 'abandons' | 'researching';
    initialMessage: string;
}

export const PERSONAS: Persona[] = [
    {
        id: 'happy-path-harry',
        name: 'Harry Gómez',
        phoneNumber: '5799999001',
        backstory: 'Dueño de una tienda de ropa en Bogotá con 3 años de experiencia',
        businessType: 'retail',
        location: 'Bogotá',
        goals: ['Aumentar ventas online', 'Automatizar inventario'],
        frustrationTriggers: [],
        behavior: {
            patienceLevel: 'high',
            pricesSensitivity: 'medium',
            trustLevel: 'high',
            techSavvy: 'medium',
        },
        expectedOutcome: 'books',
        initialMessage: 'Hola, necesito una página web para mi tienda de ropa',
    },
    {
        id: 'price-conscious-paula',
        name: 'Paula Rodríguez',
        phoneNumber: '5799999002',
        backstory: 'Dueña de una panadería en Medellín, presupuesto ajustado',
        businessType: 'food_service',
        location: 'Medellín',
        goals: ['Tener presencia online', 'Recibir pedidos por WhatsApp'],
        frustrationTriggers: ['precios altos', 'sin transparencia de costos'],
        behavior: {
            patienceLevel: 'medium',
            pricesSensitivity: 'high',
            trustLevel: 'medium',
            techSavvy: 'low',
        },
        expectedOutcome: 'books',
        initialMessage: 'Hola, cuánto cuesta una página web?',
    },
    {
        id: 'skeptical-steve',
        name: 'Esteban López',
        phoneNumber: '5799999003',
        backstory: 'Dueño de restaurante en Cali, tuvo mala experiencia con agencias',
        businessType: 'restaurant',
        location: 'Cali',
        goals: ['Sistema de reservas', 'Menú digital'],
        frustrationTriggers: ['promesas exageradas', 'falta de pruebas'],
        behavior: {
            patienceLevel: 'medium',
            pricesSensitivity: 'medium',
            trustLevel: 'low',
            techSavvy: 'medium',
        },
        expectedOutcome: 'books',
        initialMessage: 'He tenido malas experiencias con agencias. Por qué ustedes son diferentes?',
    },
    {
        id: 'abandoner-ana',
        name: 'Ana Martínez',
        phoneNumber: '5799999004',
        backstory: 'Dueña de tienda online, impaciente y frustrada',
        businessType: 'ecommerce',
        location: 'Barranquilla',
        goals: ['Solución rápida'],
        frustrationTriggers: ['muchas preguntas', 'respuestas lentas', 'no ir al grano'],
        behavior: {
            patienceLevel: 'low',
            pricesSensitivity: 'high',
            trustLevel: 'low',
            techSavvy: 'high',
        },
        expectedOutcome: 'abandons',
        initialMessage: 'Necesito una web YA. Cuánto cuesta y en cuánto tiempo la tienen lista?',
    },
    {
        id: 'vague-victor',
        name: 'Víctor Sánchez',
        phoneNumber: '5799999005',
        backstory: 'Emprendedor con idea poco clara',
        businessType: 'startup',
        location: 'Bogotá',
        goals: ['Validar idea de negocio'],
        frustrationTriggers: [],
        behavior: {
            patienceLevel: 'high',
            pricesSensitivity: 'medium',
            trustLevel: 'high',
            techSavvy: 'low',
        },
        expectedOutcome: 'books',
        initialMessage: 'Hola, tengo una idea de negocio pero no sé muy bien qué necesito',
    },
    {
        id: 'urgent-ursula',
        name: 'Úrsula Pérez',
        phoneNumber: '5799999006',
        backstory: 'Manufacturera con pedido urgente de cliente grande',
        businessType: 'manufacturing',
        location: 'Medellín',
        goals: ['Catálogo digital urgente'],
        frustrationTriggers: ['demoras', 'burocracia'],
        behavior: {
            patienceLevel: 'low',
            pricesSensitivity: 'low',
            trustLevel: 'high',
            techSavvy: 'medium',
        },
        expectedOutcome: 'books',
        initialMessage: 'Necesito un catálogo digital para ayer. Tengo un cliente grande esperando.',
    },
    {
        id: 'researcher-rachel',
        name: 'Raquel Torres',
        phoneNumber: '5799999007',
        backstory: 'Consultora investigando opciones para sus clientes',
        businessType: 'consulting',
        location: 'Bogotá',
        goals: ['Entender servicios disponibles'],
        frustrationTriggers: ['presión de venta'],
        behavior: {
            patienceLevel: 'high',
            pricesSensitivity: 'low',
            trustLevel: 'medium',
            techSavvy: 'high',
        },
        expectedOutcome: 'researching',
        initialMessage: 'Hola, estoy investigando opciones de desarrollo web para recomendar a mis clientes',
    },
    {
        id: 'referral-roberto',
        name: 'Roberto Castro',
        phoneNumber: '5799999008',
        backstory: 'Amigo de un cliente existente (high trust)',
        businessType: 'retail',
        location: 'Cartagena',
        goals: ['Tienda online'],
        frustrationTriggers: [],
        behavior: {
            patienceLevel: 'high',
            pricesSensitivity: 'low',
            trustLevel: 'high',
            techSavvy: 'medium',
        },
        expectedOutcome: 'books',
        initialMessage: 'Hola, me recomendó Carlos Jiménez. Necesito una tienda online.',
    },
    {
        id: 'multi-location-miguel',
        name: 'Miguel Ángel Vargas',
        phoneNumber: '5799999009',
        backstory: 'Franquicia con 5 locaciones',
        businessType: 'franchise',
        location: 'Bogotá',
        goals: ['Sistema centralizado', 'Gestión multi-sede'],
        frustrationTriggers: ['soluciones básicas', 'falta de escalabilidad'],
        behavior: {
            patienceLevel: 'high',
            pricesSensitivity: 'low',
            trustLevel: 'medium',
            techSavvy: 'high',
        },
        expectedOutcome: 'books',
        initialMessage: 'Tengo 5 locaciones de mi franquicia. Necesito un sistema que las unifique.',
    },
    {
        id: 'international-irene',
        name: 'Irene Morales',
        phoneNumber: '5799999010',
        backstory: 'Colombiana viviendo en USA, quiere vender en Colombia',
        businessType: 'ecommerce',
        location: 'Miami (USA)',
        goals: ['Vender desde USA a Colombia'],
        frustrationTriggers: ['falta de soporte internacional'],
        behavior: {
            patienceLevel: 'medium',
            pricesSensitivity: 'medium',
            trustLevel: 'medium',
            techSavvy: 'high',
        },
        expectedOutcome: 'books',
        initialMessage: 'Hola, estoy en Miami pero quiero vender productos en Colombia. Pueden ayudarme?',
    },
];

export function getPersonaById(id: string): Persona | undefined {
    return PERSONAS.find(p => p.id === id);
}

export function getAllPersonas(): Persona[] {
    return PERSONAS;
}
