export interface FunctionsConfig {
    project: Project;
    algolia: Algolia;
    stripe: Stripe;
}

interface Project {
    id: string;
    location: string;
    functions_endpoint: string;
    functions_location: string;
}

interface Algolia {
    app_id: string;
    api_key: string;
}

interface Stripe {
    live_key: string;
    test_key: string;
    pi_requires_action_secret: string;
    pi_succeeded_secret: string;
}
