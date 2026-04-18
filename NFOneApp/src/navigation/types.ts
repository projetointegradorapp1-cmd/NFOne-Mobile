export type RootStackParamList = {
    Login: undefined;
    Main: undefined;
};

export type MainStackParamList = {
    Dashboard: undefined;
    Faturamento: { isDarkMode: boolean };
    Catalogo: { isDarkMode: boolean };
    Logistica: { isDarkMode: boolean };
    Admin: { isDarkMode: boolean };
};