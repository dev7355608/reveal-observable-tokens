import TokenMixin from "./token.mjs";

Hooks.once("setup", () => {
    if (game.user.isGM || game.settings.get("core", "noCanvas")) {
        return;
    }

    CONFIG.Token.objectClass = TokenMixin(CONFIG.Token.objectClass);
});
