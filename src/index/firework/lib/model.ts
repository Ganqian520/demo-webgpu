export const cubeModel = {
    vertexCount: 36,
    arrayStride: [3,2],
    data: [
        // float3 position, float2 uv
        // face1
        +1, -1, +1,    1, 1,
        -1, -1, +1,    0, 1,
        -1, -1, -1,    0, 0,
        +1, -1, -1,    1, 0,
        +1, -1, +1,    1, 1,
        -1, -1, -1,    0, 0,
        // face2
        +1, +1, +1,    1, 1,
        +1, -1, +1,    0, 1,
        +1, -1, -1,    0, 0,
        +1, +1, -1,    1, 0,
        +1, +1, +1,    1, 1,
        +1, -1, -1,    0, 0,
        // face3
        -1, +1, +1,    1, 1,
        +1, +1, +1,    0, 1,
        +1, +1, -1,    0, 0,
        -1, +1, -1,    1, 0,
        -1, +1, +1,    1, 1,
        +1, +1, -1,    0, 0,
        // face4
        -1, -1, +1,    1, 1,
        -1, +1, +1,    0, 1,
        -1, +1, -1,    0, 0,
        -1, -1, -1,    1, 0,
        -1, -1, +1,    1, 1,
        -1, +1, -1,    0, 0,
        // face5
        +1, +1, +1,    1, 1,
        -1, +1, +1,    0, 1,
        -1, -1, +1,    0, 0,
        -1, -1, +1,    0, 0,
        +1, -1, +1,    1, 0,
        +1, +1, +1,    1, 1,
        // face6
        +1, -1, -1,    1, 1,
        -1, -1, -1,    0, 1,
        -1, +1, -1,    0, 0,
        +1, +1, -1,    1, 0,
        +1, -1, -1,    1, 1,
        -1, +1, -1,    0, 0
    ].map(v => v / 2)
}