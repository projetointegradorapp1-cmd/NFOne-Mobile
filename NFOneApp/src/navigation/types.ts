export type RootStackParamList = {
    Login: undefined;
    Main: undefined;
};

export type MainStackParamList = {
    Dashboard: undefined;
    Faturamento: { isDarkMode: boolean };
    Catalogo: { isDarkMode: boolean }; // Este agora será o Catálogo Técnico
    Logistica: { isDarkMode: boolean };
    Admin: { isDarkMode: boolean };
    Clientes: undefined; // Nova aba
};