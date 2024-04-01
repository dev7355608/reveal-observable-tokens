Hooks.once("init", () => {
    function setup() {
        if (game.user.isGM || game.settings.get("core", "noCanvas")) {
            return;
        }

        const testVisiblity = foundry.utils.isNewerVersion(game.version, 12)
            ? (token) => {
                const { width, height } = token.getSize();
                const tolerance = Math.min(width, height) / 4;

                return canvas.visibility.testVisibility(token.center, { tolerance, object: token });
            }
            : (token) => {
                const tolerance = Math.min(token.w, token.h) / 4;

                return canvas.effects.visibility.testVisibility(token.center, { tolerance, object: token });
            };

        CONFIG.Token.objectClass = class extends CONFIG.Token.objectClass {
            /** @override */
            get isVisible() {
                if (canvas.scene.tokenVision && !this.document.hidden
                    && this.actor?.testUserPermission(game.user, "OBSERVER")
                    && !canvas.effects.visionSources.get(this.sourceId)?.active) {
                    this.detectionFilter = undefined;

                    if (!testVisiblity(this)) {
                        this.detectionFilter = hatchFilter;
                    }

                    return true;
                }

                return super.isVisible;
            }
        };

        class HatchFilter extends AbstractBaseFilter {
            /** @override */
            static vertexShader = `\
                attribute vec2 aVertexPosition;

                uniform vec4 inputSize;
                uniform vec4 outputFrame;
                uniform mat3 projectionMatrix;
                uniform vec2 origin;
                uniform mediump float thickness;

                varying vec2 vTextureCoord;
                varying float vOffset;

                void main() {
                    vTextureCoord = (aVertexPosition * outputFrame.zw) * inputSize.zw;
                    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.0)) + outputFrame.xy;
                    vec2 offset = position - origin;
                    vOffset = (offset.x + offset.y) / (2.0 * thickness);
                    gl_Position = vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
                }
            `;

            /** @override */
            static fragmentShader = `\
                varying vec2 vTextureCoord;
                varying float vOffset;

                uniform sampler2D uSampler;
                uniform mediump float thickness;

                void main() {
                    float x = abs(vOffset - floor(vOffset + 0.5)) * 2.0;
                    float y0 = clamp((x + 0.5) * thickness + 0.5, 0.0, 1.0);
                    float y1 = clamp((x - 0.5) * thickness + 0.5, 0.0, 1.0);
                    float y = y0 - y1;
                    float alpha = texture2D(uSampler, vTextureCoord).a * 0.25;
                    gl_FragColor = vec4(y, y, y, 1.0) * alpha;
                }
            `;

            /** @override */
            static defaultUniforms = {
                origin: { x: 0, y: 0 },
                thickness: 1
            };

            /** @override */
            apply(filterManager, input, output, clearMode, currentState) {
                const uniforms = this.uniforms;
                const worldTransform = currentState.target.worldTransform;

                uniforms.origin.x = worldTransform.tx;
                uniforms.origin.y = worldTransform.ty;
                uniforms.thickness = canvas.dimensions.size / 25 * canvas.stage.scale.x;

                super.apply(filterManager, input, output, clearMode, currentState);
            }
        }

        const hatchFilter = HatchFilter.create();
    };

    if (foundry.utils.isNewerVersion(game.version, 11)) {
        Hooks.once("setup", setup);
    } else {
        Hooks.once("setup", () => {
            if (!game.settings.get("core", "noCanvas")) {
                Hooks.once("canvasInit", setup);
            }
        });
    }
});
