import TokenMixin from "./token.mjs";

Hooks.once("setup", () => {
    if (game.user.isGM) {
        return;
    }

    CONFIG.Token.objectClass = TokenMixin(CONFIG.Token.objectClass);
});
