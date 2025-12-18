/**
 * lib/testing/scenarios.ts
 * 10 realistic test scenarios covering diverse customer behaviors
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

export const testScenarios: Persona[] = [
    // SCENARIO 1: Happy Path - Eager Buyer
    {
        id: 'happy-path-eager',
        name: 'Carlos Mendoza',
        phoneNumber: '5799999001',
        backstory: 'Dueño de una panadería exitosa en Medellín. Ya está convencido de que necesita digitalización después de perder varios pedidos por no tener sistema online.',
        businessType: 'panadería',
        location: 'Medellín',
        goals: ['Recibir pedidos online', 'Reducir llamadas repetitivas', 'Crecer ventas'],
        frustrationTriggers: [],
        behavior: {
            patienceLevel: 'high',
            pricesSensitivity: 'low',
            trustLevel: 'high',
            techSavvy: 'medium',
        },
        expectedOutcome: 'books',
        initialMessage: 'Hola! Necesito un sistema para recibir pedidos de mi panadería. Estoy perdiendo clientes porque no contesto rápido',
    },

    // SCENARIO 2: Price Objector - Budget-Conscious
    {
        id: 'price-objector',
        name: 'María Rodríguez',
        phoneNumber: '5799999002',
        backstory: 'Startupera con una tienda de ropa online pequeña. Muy interesada pero tiene presupuesto limitado. Necesita ver el ROI claro.',
        businessType: 'tienda online de ropa',
        location: 'Bogotá',
        goals: ['Automatizar atención al cliente', 'Escala sin contratar'],
        frustrationTriggers: ['Inversión que no se recupera rápido'],
        behavior: {
            patienceLevel: 'medium',
            pricesSensitivity: 'high',
            trustLevel: 'medium',
            techSavvy: 'high',
        },
        expectedOutcome: 'books',
        initialMessage: 'Hola, vi tu servicio. Me interesa pero primero necesito saber el precio',
    },

    // SCENARIO 3: Skeptical Researcher - Needs Proof
    {
        id: 'skeptical-researcher',
        name: 'Roberto Sánchez',
        phoneNumber: '5799999003',
        backstory: 'Gerente de operaciones de cadena de restaurantes. Ha tenido malas experiencias con proveedores de tecnología. Muy cuidadoso.',
        businessType: 'cadena de restaurantes',
        location: 'Cali',
        goals: ['Validar que funciona antes de comprometerse', 'Ver casos de éxito'],
        frustrationTriggers: ['Promesas sin cumplir', 'Falta de transparencia'],
        behavior: {
            patienceLevel: 'high',
            pricesSensitivity: 'medium',
            trustLevel: 'low',
            techSavvy: 'medium',
        },
        expectedOutcome: 'researching',
        initialMessage: 'He tenido malas experiencias con sistemas así. ¿Qué garantías me dan de que esto funciona?',
    },

    // SCENARIO 4: Urgent Need - Time-Sensitive
    {
        id: 'urgent-buyer',
        name: 'Andrea Torres',
        phoneNumber: '5799999004',
        backstory: 'Lanzando un nuevo producto el próximo mes y necesita solución YA. Está dispuesta a pagar más por velocidad.',
        businessType: 'productos de belleza',
        location: 'Barranquilla',
        goals: ['Implementación rápida', 'Estar lista para lanzamiento'],
        frustrationTriggers: ['Procesos largos', 'Demoras'],
        behavior: {
            patienceLevel: 'low',
            pricesSensitivity: 'low',
            trustLevel: 'medium',
            techSavvy: 'medium',
        },
        expectedOutcome: 'books',
        initialMessage: 'Necesito un catálogo digital URGENTE. Lanzo producto en 3 semanas. Cuánto demora implementación?',
    },

    // SCENARIO 5: Vague Inquirer - Needs Diagnosis
    {
        id: 'vague-inquirer',
        name: 'Luis Herrera',
        phoneNumber: '5799999005',
        backstory: 'Emprendedor nuevo con idea de negocio pero no está claro qué necesita exactamente. Necesita orientación.',
        businessType: 'idea de negocio',
        location: 'Bogotá',
        goals: ['Entender qué necesita', 'Validar su idea'],
        frustrationTriggers: [],
        behavior: {
            patienceLevel: 'high',
            pricesSensitivity: 'medium',
            trustLevel: 'medium',
            techSavvy: 'low',
        },
        expectedOutcome: 'books',
        initialMessage: 'Hola, tengo una idea de negocio pero no sé bien qué sistema necesito. Me ayudas?',
    },

    // SCENARIO 6: Abandoner - Unaffordable
    {
        id: 'abandoner-price',
        name: 'Pedro Castro',
        phoneNumber: '5799999006',
        backstory: 'Negocio muy pequeño con presupuesto casi cero. Le interesa pero realmente no puede pagar.',
        businessType: 'taller mecánico pequeño',
        location: 'Pereira',
        goals: ['Encontrar solución gratuita o muy barata'],
        frustrationTriggers: ['Cualquier costo significativo'],
        behavior: {
            patienceLevel: 'medium',
            pricesSensitivity: 'high',
            trustLevel: 'medium',
            techSavvy: 'low',
        },
        expectedOutcome: 'abandons',
        initialMessage: 'Hola, necesito algo para mi tallercito pero tengo presupuesto muy limitado',
    },

    // SCENARIO 7: Abandoner - No Time
    {
        id: 'abandoner-busy',
        name: 'Diana López',
        phoneNumber: '5799999007',
        backstory: 'Súper ocupada manejando 3 negocios. Le interesa pero no tiene tiempo para implementar ahora.',
        businessType: 'múltiples negocios',
        location: 'Medellín',
        goals: ['Solución para el futuro'],
        frustrationTriggers: ['Necesita tiempo para implementar', 'Sobrecargada'],
        behavior: {
            patienceLevel: 'low',
            pricesSensitivity: 'low',
            trustLevel: 'high',
            techSavvy: 'medium',
        },
        expectedOutcome: 'abandons',
        initialMessage: 'Esto se ve interesante pero ando súper ocupada. Es muy complicado de implementar?',
    },

    // SCENARIO 8: Comparison Shopper
    {
        id: 'comparison-shopper',
        name: 'Julián Ramírez',
        phoneNumber: '5799999008',
        backstory: 'Está comparando 4 proveedores diferentes. Metódico y analítico. Quiere ver pros/contras.',
        businessType: 'servicios profesionales',
        location: 'Bogotá',
        goals: ['Comparar opciones', 'Tomar decisión informada'],
        frustrationTriggers: [],
        behavior: {
            patienceLevel: 'high',
            pricesSensitivity: 'medium',
            trustLevel: 'medium',
            techSavvy: 'high',
        },
        expectedOutcome: 'researching',
        initialMessage: 'Estoy evaluando varias opciones de automatización. Qué los diferencia de la competencia?',
    },

    // SCENARIO 9: Complex Enterprise Deal
    {
        id: 'enterprise-complex',
        name: 'Patricia Gómez',
        phoneNumber: '5799999009',
        backstory: 'Directora de operaciones de franquicia con 8 locaciones. Necesidad compleja que requiere solución custom.',
        businessType: 'franquicia de comida rápida',
        location: 'Bogotá',
        goals: ['Sistema unificado para todas las locaciones', 'Personalización'],
        frustrationTriggers: [],
        behavior: {
            patienceLevel: 'high',
            pricesSensitivity: 'low',
            trustLevel: 'medium',
            techSavvy: 'medium',
        },
        expectedOutcome: 'books',
        initialMessage: 'Tengo 8 locaciones de mi franquicia. Necesito un sistema que unifique todo. Es posible?',
    },

    // SCENARIO 10: International Lead
    {
        id: 'international-lead',
        name: 'Alejandra Vargas',
        phoneNumber: '5799999010',
        backstory: 'Colombiana viviendo en USA que quiere vender productos colombianos allá. Timezone challenge.',
        businessType: 'e-commerce internacional',
        location: 'Miami (USA)',
        goals: ['Vender productos colombianos en USA', 'Manejar dos mercados'],
        frustrationTriggers: [],
        behavior: {
            patienceLevel: 'medium',
            pricesSensitivity: 'medium',
            trustLevel: 'high',
            techSavvy: 'high',
        },
        expectedOutcome: 'books',
        initialMessage: 'Hola! Estoy en Miami pero quiero vender productos colombianos en USA. Pueden ayudarme con el sistema?',
    },
];

export function getAllScenarios(): Persona[] {
    return testScenarios;
}

export function getScenarioById(id: string): Persona | undefined {
    return testScenarios.find(s => s.id === id);
}

// Validation criteria for each scenario
export const scenarioValidations = {
    'happy-path-eager': {
        expectedTurns: { min: 4, max: 8 },
        mustHave: ['appointment_booked', 'positive_sentiment'],
        mustNotHave: ['abandonment_signal'],
    },
    'price-objector': {
        expectedTurns: { min: 5, max: 10 },
        mustHave: ['appointment_booked', 'price_objection_handled'],
        mustNotHave: [],
    },
    'skeptical-researcher': {
        expectedTurns: { min: 6, max: 12 },
        mustHave: ['research_stage_logged', 'detailed_questions_answered'],
        canHave: ['appointment_booked', 'follow_up_scheduled'],
    },
    'urgent-buyer': {
        expectedTurns: { min: 3, max: 6 },
        mustHave: ['appointment_booked', 'urgent_flag_set'],
        mustNotHave: [],
    },
    'vague-inquirer': {
        expectedTurns: { min: 5, max: 10 },
        mustHave: ['profile_enriched', 'needs_diagnosed'],
        canHave: ['appointment_booked'],
    },
    'abandoner-price': {
        expectedTurns: { min: 3, max: 8 },
        mustHave: ['abandonment_detected', 'price_reason_logged'],
        mustNotHave: ['appointment_booked'],
    },
    'abandoner-busy': {
        expectedTurns: { min: 3, max: 7 },
        mustHave: ['abandonment_detected', 'timing_reason_logged'],
        mustNotHave: ['appointment_booked'],
    },
    'comparison-shopper': {
        expectedTurns: { min: 6, max: 12 },
        mustHave: ['competitive_positioning_shown', 'detailed_comparison'],
        canHave: ['appointment_booked'],
    },
    'enterprise-complex': {
        expectedTurns: { min: 7, max: 15 },
        mustHave: ['complex_needs_identified', 'custom_solution_discussed'],
        canHave: ['appointment_booked', 'escalation_triggered'],
    },
    'international-lead': {
        expectedTurns: { min: 5, max: 10 },
        mustHave: ['international_flag_set', 'timezone_handled'],
        canHave: ['appointment_booked'],
    },
};
