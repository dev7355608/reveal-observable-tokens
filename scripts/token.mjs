import DetectionFilter from "./detection-filter.mjs";

/** @type {DetectionFilter|undefined} */
let detectionFilter;

/**
 * @type {(Token: typeof foundry.canvas.placeables.Token) => typeof foundry.canvas.placeables.Token}
 */
export default (Token) => class extends Token {
    /** @override */
    get isVisible() {
        if (canvas.scene.tokenVision && !this.document.hidden && !this.vision?.active
            && this.actor?.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
            const { width, height } = this.document.getSize();
            const tolerance = Math.min(width, height) / 4;
            const visible = canvas.visibility.testVisibility(this.center, { tolerance, object: this });

            this.detectionFilter = visible ? null : detectionFilter ??= DetectionFilter.create();

            return true;
        }

        return super.isVisible;
    }
};
