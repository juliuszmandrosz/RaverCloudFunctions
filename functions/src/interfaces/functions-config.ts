export interface FunctionsConfig {
    project: Project;
    algolia: Algolia;
    stripe: Stripe;
    typesense: Typesense;
    email_labs: EmailLabs;
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
    api_key: string;
    pi_succeeded_secret: string;
    pi_requires_action_secret: string;
}

interface Typesense {
    cluster_id: string;
    api_key: string;
}

interface EmailLabs {
    smtp_user: string;
    smtp_password: string;
}
