
const translations = {
    en: {
        // Authentication
        'auth.welcome': 'Welcome',
        'auth.login': 'Login',
        'auth.register': 'Register',
        'auth.forgot_password': 'Forgot Password',
        'auth.reset_password': 'Reset Password',
        'auth.activation_code_required': 'Activation code required',
        'auth.invalid_credentials': 'Invalid credentials',
        
        // Deals
        'deals.title': 'Deals',
        'deals.discount': 'Discount',
        'deals.expires': 'Expires',
        'deals.redeem': 'Redeem',
        'deals.saved': 'Saved',
        
        // Profile
        'profile.title': 'Profile',
        'profile.edit': 'Edit Profile',
        'profile.settings': 'Settings',
        'profile.subscription': 'Subscription',
        
        // Common
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.confirm': 'Confirm',
        'common.loading': 'Loading...',
        'common.error': 'Error occurred',
        'common.success': 'Success'
    },
    hr: {
        // Authentication
        'auth.welcome': 'Dobrodošli',
        'auth.login': 'Prijava',
        'auth.register': 'Registracija',
        'auth.forgot_password': 'Zaboravljena lozinka',
        'auth.reset_password': 'Resetuj lozinku',
        'auth.activation_code_required': 'Potreban je aktivacijski kod',
        'auth.invalid_credentials': 'Neispravni podaci',
        
        // Deals
        'deals.title': 'Ponude',
        'deals.discount': 'Popust',
        'deals.expires': 'Ističe',
        'deals.redeem': 'Iskoristi',
        'deals.saved': 'Sačuvano',
        
        // Profile
        'profile.title': 'Profil',
        'profile.edit': 'Uredi profil',
        'profile.settings': 'Postavke',
        'profile.subscription': 'Pretplata',
        
        // Common
        'common.save': 'Sačuvaj',
        'common.cancel': 'Otkaži',
        'common.confirm': 'Potvrdi',
        'common.loading': 'Učitava...',
        'common.error': 'Došlo je do greške',
        'common.success': 'Uspeh'
    }
};

const getTranslation = (key, language = 'en') => {
    return translations[language]?.[key] || translations.en[key] || key;
};

const localizationMiddleware = (req, res, next) => {
    const language = req.headers['accept-language']?.includes('hr') ? 'hr' : 'en';
    req.language = language;
    req.t = (key) => getTranslation(key, language);
    next();
};

module.exports = {
    getTranslation,
    localizationMiddleware,
    translations
};
