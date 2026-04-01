import DetectionFilter from "./detection-filter.mjs";

/** @type {DetectionFilter|undefined} */
let detectionFilter;

/**
 * @type {(Token: typeof foundry.canvas.placeables.Token) => typeof foundry.canvas.placeables.Token}
 */
export default (Token) => class extends Token {
    /** @override */
    get isVisible() {
        if (!this.isPreview && this._preview?.previewType !== "config"
            && !(this.layer.active && this.document.visible && ui.placeables?.isEntryVisible(this) === false)
            && canvas.scene.tokenVision && !this.document.hidden && !this.vision?.active
            && this.actor?.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
            let visible;

            if (game.release.generation >= 14) {
                visible = canvas.visibility.testVisibility(this.document.getVisibilityTestPoints(), { tolerance: 0, object: this });
            } else {
                const { width, height } = this.document.getSize();
                const tolerance = Math.min(width, height) / 4;

                visible = canvas.visibility.testVisibility(this.center, { tolerance, object: this });
            }

            this.detectionFilter = visible ? null : detectionFilter ??= DetectionFilter.create();

            return true;
        }

        return super.isVisible;
    }
};
