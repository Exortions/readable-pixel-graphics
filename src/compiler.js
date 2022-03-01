const PNG = require("pngjs").PNG;
const Jimp = require("jimp");
const fs = require("fs");

function parseCommand(command) {
    let commandArray = command.split(" ");
    let commandName = commandArray[0];
    let commandArgs = commandArray.slice(1);
    return {
        name: commandName.toUpperCase(),
        args: commandArgs,
    };
}

function drawLine(positions, x1, y1, x2, y2, r, g, b, width) {
    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);
    let sx = (x1 < x2) ? 1 : -1;
    let sy = (y1 < y2) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        positions[y1 * width + x1] = [x1, y1, r, g, b];
        if (x1 == x2 && y1 == y2) break;
        let e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x1 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y1 += sy;
        }
    }
}

function getPixelsOnLine(x1, y1, x2, y2, width) {
    // Return the x and y value of all pixels on the line
    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);
    let sx = (x1 < x2) ? 1 : -1;
    let sy = (y1 < y2) ? 1 : -1;
    let err = dx - dy;
    let pixels = [];

    while (true) {
        pixels.push([x1, y1]);
        if (x1 == x2 && y1 == y2) break;
        let e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x1 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y1 += sy;
        }
    }
    return pixels;
}

function read(file) {
    let lines;

    let default_color = [255, 255, 255];
    let width;
    let height;
    let positions;

    if (!file.endsWith(".rpg")) return;

    const checkPositions = () => {
        if (!positions && width && height) positions = new Array(width * height);
    }

    fs.readFile(file, "utf8", (err, data) => {
        if (err) throw err;

        lines = data.split("\n");

        for (let line in lines) {
            line = lines[line];

            let command = parseCommand(line);
            if (command.name == "W") {
                width = Number(command.args[0]);
            } else if (command.name == "H") {
                height = Number(command.args[0]);
            } else if (command.name == "D") {
                checkPositions();

                let x = Number(command.args[0]);
                let y = Number(command.args[1]);
                let r = Number(command.args[2]);
                let g = Number(command.args[3]);
                let b = Number(command.args[4]);
                positions[y * width + x] = [x, y, r, g, b];
            } else if (command.name == "F") {
                checkPositions();

                let x1 = Number(command.args[0]);
                let y1 = Number(command.args[1]);
                let x2 = Number(command.args[2]);
                let y2 = Number(command.args[3]);
                let r = Number(command.args[4]);
                let g = Number(command.args[5]);
                let b = Number(command.args[6]);

                let x_min = Math.min(x1, x2);
                let x_max = Math.max(x1, x2);
                let y_min = Math.min(y1, y2);
                let y_max = Math.max(y1, y2);

                for (let x = x_min; x <= x_max; x++) {
                    for (let y = y_min; y <= y_max; y++) {
                        positions[y * width + x] = [x, y, r, g, b];
                    }
                }
            } else if (command.name == "C") {
                checkPositions();

                let x = Number(command.args[0]);
                let y = Number(command.args[1]);
                let radius = Number(command.args[2]);
                let r = Number(command.args[3]);
                let g = Number(command.args[4]);
                let b = Number(command.args[5]);

                for (let x_ = x - radius; x_ <= x + radius; x_++) {
                    for (let y_ = y - radius; y_ <= y + radius; y_++) {
                        if (
                            (x_ - x) ** 2 + (y_ - y) ** 2 <=
                            radius ** 2
                        ) {
                            positions[y_ * width + x_] = [
                                x_,
                                y_,
                                r,
                                g,
                                b,
                            ];
                        }
                    }
                }
            } else if (command.name == 'FG') {
                checkPositions();

                let starting_location = command.args[0];
                let ending_location = command.args[1];
                let x1 = Number(command.args[2]);
                let y1 = Number(command.args[3]);
                let x2 = Number(command.args[4]);
                let y2 = Number(command.args[5]);
                let r1 = Number(command.args[6]);
                let g1 = Number(command.args[7]);
                let b1 = Number(command.args[8]);
                let r2 = Number(command.args[9]);
                let g2 = Number(command.args[10]);
                let b2 = Number(command.args[11]);

                if (starting_location == "top-left") {
                    for (let x = x1; x <= x2; x++) {
                        for (let y = y1; y <= y2; y++) {
                            let gradient = (y - y1) / (y2 - y1);
                            let r = Math.floor(r1 + (r2 - r1) * gradient);
                            let g = Math.floor(g1 + (g2 - g1) * gradient);
                            let b = Math.floor(b1 + (b2 - b1) * gradient);
                            positions[y * width + x] = [x, y, r, g, b];
                        }
                    }
                } else if (starting_location == "top-right") {
                    for (let x = x1; x >= x2; x--) {
                        for (let y = y1; y <= y2; y++) {
                            let gradient = (y - y1) / (y2 - y1);
                            let r = Math.floor(r1 + (r2 - r1) * gradient);
                            let g = Math.floor(g1 + (g2 - g1) * gradient);
                            let b = Math.floor(b1 + (b2 - b1) * gradient);
                            positions[y * width + x] = [x, y, r, g, b];
                        }
                    }
                } else if (starting_location == "bottom-left") {
                    for (let x = x1; x <= x2; x++) {
                        for (let y = y1; y >= y2; y--) {
                            let gradient = (y - y1) / (y2 - y1);
                            let r = Math.floor(r1 + (r2 - r1) * gradient);
                            let g = Math.floor(g1 + (g2 - g1) * gradient);
                            let b = Math.floor(b1 + (b2 - b1) * gradient);
                            positions[y * width + x] = [x, y, r, g, b];
                        }
                    }
                } else if (starting_location == "bottom-right") {
                    for (let x = x1; x >= x2; x--) {
                        for (let y = y1; y >= y2; y--) {
                            let gradient = (y - y1) / (y2 - y1);
                            let r = Math.floor(r1 + (r2 - r1) * gradient);
                            let g = Math.floor(g1 + (g2 - g1) * gradient);
                            let b = Math.floor(b1 + (b2 - b1) * gradient);
                            positions[y * width + x] = [x, y, r, g, b];
                        }
                    }
                } else if (starting_location == "center") {
                    for (let x = x1; x <= x2; x++) {
                        for (let y = y1; y <= y2; y++) {
                            let gradient = (y - y1) / (y2 - y1);
                            let r = Math.floor(r1 + (r2 - r1) * gradient);
                            let g = Math.floor(g1 + (g2 - g1) * gradient);
                            let b = Math.floor(b1 + (b2 - b1) * gradient);
                            positions[y * width + x] = [x, y, r, g, b];
                        }
                    }
                } else if (starting_location == "top") {
                    for (let x = x1; x <= x2; x++) {
                        for (let y = y1; y <= y2; y++) {
                            let gradient = (x - x1) / (x2 - x1);
                            let r = Math.floor(r1 + (r2 - r1) * gradient);
                            let g = Math.floor(g1 + (g2 - g1) * gradient);
                            let b = Math.floor(b1 + (b2 - b1) * gradient);
                            positions[y * width + x] = [x, y, r, g, b];
                        }
                    }
                } else if (starting_location == "bottom") {
                    for (let x = x1; x <= x2; x++) {
                        for (let y = y1; y >= y2; y--) {
                            let gradient = (x - x1) / (x2 - x1);
                            let r = Math.floor(r1 + (r2 - r1) * gradient);
                            let g = Math.floor(g1 + (g2 - g1) * gradient);
                            let b = Math.floor(b1 + (b2 - b1) * gradient);
                            positions[y * width + x] = [x, y, r, g, b];
                        }
                    }
                } else if (starting_location == "left") {
                    for (let x = x1; x <= x2; x++) {
                        for (let y = y1; y <= y2; y++) {
                            let gradient = (y - y1) / (y2 - y1);
                            let r = Math.floor(r1 + (r2 - r1) * gradient);
                            let g = Math.floor(g1 + (g2 - g1) * gradient);
                            let b = Math.floor(b1 + (b2 - b1) * gradient);
                            positions[y * width + x] = [x, y, r, g, b];
                        }
                    }
                } else if (starting_location == "right") {
                    for (let x = x1; x >= x2; x--) {
                        for (let y = y1; y <= y2; y++) {
                            let gradient = (y - y1) / (y2 - y1);
                            let r = Math.floor(r1 + (r2 - r1) * gradient);
                            let g = Math.floor(g1 + (g2 - g1) * gradient);
                            let b = Math.floor(b1 + (b2 - b1) * gradient);
                            positions[y * width + x] = [x, y, r, g, b];
                        }
                    }
                }
            } else if (command.name == "L") {
                checkPositions();

                let x1 = parseInt(command.args[0]);
                let y1 = parseInt(command.args[1]);
                let x2 = parseInt(command.args[2]);
                let y2 = parseInt(command.args[3]);
                let r = parseInt(command.args[4]);
                let g = parseInt(command.args[5]);
                let b = parseInt(command.args[6]);

                drawLine(positions, x1, y1, x2, y2, r, g, b, width);
            } else if (command.name == "T") {
                checkPositions();

                let x1 = parseInt(command.args[0]);
                let y1 = parseInt(command.args[1]);
                let x2 = parseInt(command.args[2]);
                let y2 = parseInt(command.args[3]);
                let x3 = parseInt(command.args[4]);
                let y3 = parseInt(command.args[5]);
                let r = parseInt(command.args[6]);
                let g = parseInt(command.args[7]);
                let b = parseInt(command.args[8]);

                drawLine(positions, x1, y1, x2, y2, r, g, b, width);
                drawLine(positions, x2, y2, x3, y3, r, g, b, width);
                drawLine(positions, x3, y3, x1, y1, r, g, b, width);

                if (command.args[9] == "--fill") {
                    let pixels = [];

                    let pixels_on_line_1 = getPixelsOnLine(x1, y1, x2, y2);
                    let pixels_on_line_2 = getPixelsOnLine(x2, y2, x3, y3);
                    let pixels_on_line_3 = getPixelsOnLine(x3, y3, x1, y1);

                    for (let i = 0; i < pixels_on_line_1.length; i++) pixels.push(pixels_on_line_1[i]);
                    for (let i = 0; i < pixels_on_line_2.length; i++) pixels.push(pixels_on_line_2[i]);
                    for (let i = 0; i < pixels_on_line_3.length; i++) pixels.push(pixels_on_line_3[i]);

                    let inside = [];
                    let x_min = Math.min(x1, x2, x3);
                    let x_max = Math.max(x1, x2, x3);
                    let y_min = Math.min(y1, y2, y3);
                    let y_max = Math.max(y1, y2, y3);

                    for (let x = x_min; x <= x_max; x++) {
                        for (let y = y_min; y <= y_max; y++) {
                            let inside_triangle = (x, y, x1, y1, x2, y2, x3, y3) => {
                                let d = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1);
                                let e = (x - x2) * (y3 - y2) - (y - y2) * (x3 - x2);
                                let f = (x - x3) * (y1 - y3) - (y - y3) * (x1 - x3);

                                return d * e >= 0 && e * f >= 0;
                            };
                            const inside_triangle_result = inside_triangle(x, y, x1, y1, x2, y2, x3, y3);
                            if (inside_triangle_result && !pixels.includes[[x, y]] && pixels.find(p => p[0] == x && p[1] == y) == undefined) {
                                console.log('push ', [x, y],);
                                inside.push([x, y]);
                            }
                        }
                    }

                    if (command.args[10] != undefined && command.args[11] != undefined && command.args[12] != undefined) {
                        r = Number(command.args[10]);
                        g = Number(command.args[11]);
                        b = Number(command.args[12]);
                    }

                    for (let pixel of inside) {
                        positions[pixel[1] * width + pixel[0]] = [pixel[0], pixel[1], r, g, b];
                    }
                }
            } else if (command.name == "--DEFAULT-COLOR") {
                if (command.args[0] == "-TRANSPARENT") {
                    default_color = "transparent";
                }
                default_color = [
                    Number(command.args[0]),
                    Number(command.args[1]),
                    Number(command.args[2]),
                ];
            } else if (command.name == "I") {
                checkPositions();

                let included_lines = fs.readFileSync(command.args[0], "utf8").split("\n");

                included_lines.forEach(included_line => {
                    if (included_line.length > 0) {

                        let command = parseCommand(included_line);
                        if (command.name == "D") {
                            checkPositions();

                            let x = Number(command.args[0]);
                            let y = Number(command.args[1]);
                            let r = Number(command.args[2]);
                            let g = Number(command.args[3]);
                            let b = Number(command.args[4]);
                            positions[y * width + x] = [x, y, r, g, b];
                        } else if (command.name == "F") {
                            checkPositions();

                            let x1 = Number(command.args[0]);
                            let y1 = Number(command.args[1]);
                            let x2 = Number(command.args[2]);
                            let y2 = Number(command.args[3]);
                            let r = Number(command.args[4]);
                            let g = Number(command.args[5]);
                            let b = Number(command.args[6]);

                            let x_min = Math.min(x1, x2);
                            let x_max = Math.max(x1, x2);
                            let y_min = Math.min(y1, y2);
                            let y_max = Math.max(y1, y2);

                            for (let x = x_min; x <= x_max; x++) {
                                for (let y = y_min; y <= y_max; y++) {
                                    positions[y * width + x] = [x, y, r, g, b];
                                }
                            }
                        } else if (command.name == "C") {
                            checkPositions();

                            let x = Number(command.args[0]);
                            let y = Number(command.args[1]);
                            let radius = Number(command.args[2]);
                            let r = Number(command.args[3]);
                            let g = Number(command.args[4]);
                            let b = Number(command.args[5]);

                            for (let x_ = x - radius; x_ <= x + radius; x_++) {
                                for (let y_ = y - radius; y_ <= y + radius; y_++) {
                                    if (
                                        (x_ - x) ** 2 + (y_ - y) ** 2 <=
                                        radius ** 2
                                    ) {
                                        positions[y_ * width + x_] = [
                                            x_,
                                            y_,
                                            r,
                                            g,
                                            b,
                                        ];
                                    }
                                }
                            }
                        } else if (command.name == 'FG') {
                            checkPositions();

                            let starting_location = command.args[0];
                            let ending_location = command.args[1];
                            let x1 = Number(command.args[2]);
                            let y1 = Number(command.args[3]);
                            let x2 = Number(command.args[4]);
                            let y2 = Number(command.args[5]);
                            let r1 = Number(command.args[6]);
                            let g1 = Number(command.args[7]);
                            let b1 = Number(command.args[8]);
                            let r2 = Number(command.args[9]);
                            let g2 = Number(command.args[10]);
                            let b2 = Number(command.args[11]);

                            if (starting_location == "top-left") {
                                for (let x = x1; x <= x2; x++) {
                                    for (let y = y1; y <= y2; y++) {
                                        let gradient = (y - y1) / (y2 - y1);
                                        let r = Math.floor(r1 + (r2 - r1) * gradient);
                                        let g = Math.floor(g1 + (g2 - g1) * gradient);
                                        let b = Math.floor(b1 + (b2 - b1) * gradient);
                                        positions[y * width + x] = [x, y, r, g, b];
                                    }
                                }
                            } else if (starting_location == "top-right") {
                                for (let x = x1; x >= x2; x--) {
                                    for (let y = y1; y <= y2; y++) {
                                        let gradient = (y - y1) / (y2 - y1);
                                        let r = Math.floor(r1 + (r2 - r1) * gradient);
                                        let g = Math.floor(g1 + (g2 - g1) * gradient);
                                        let b = Math.floor(b1 + (b2 - b1) * gradient);
                                        positions[y * width + x] = [x, y, r, g, b];
                                    }
                                }
                            } else if (starting_location == "bottom-left") {
                                for (let x = x1; x <= x2; x++) {
                                    for (let y = y1; y >= y2; y--) {
                                        let gradient = (y - y1) / (y2 - y1);
                                        let r = Math.floor(r1 + (r2 - r1) * gradient);
                                        let g = Math.floor(g1 + (g2 - g1) * gradient);
                                        let b = Math.floor(b1 + (b2 - b1) * gradient);
                                        positions[y * width + x] = [x, y, r, g, b];
                                    }
                                }
                            } else if (starting_location == "bottom-right") {
                                for (let x = x1; x >= x2; x--) {
                                    for (let y = y1; y >= y2; y--) {
                                        let gradient = (y - y1) / (y2 - y1);
                                        let r = Math.floor(r1 + (r2 - r1) * gradient);
                                        let g = Math.floor(g1 + (g2 - g1) * gradient);
                                        let b = Math.floor(b1 + (b2 - b1) * gradient);
                                        positions[y * width + x] = [x, y, r, g, b];
                                    }
                                }
                            } else if (starting_location == "center") {
                                for (let x = x1; x <= x2; x++) {
                                    for (let y = y1; y <= y2; y++) {
                                        let gradient = (y - y1) / (y2 - y1);
                                        let r = Math.floor(r1 + (r2 - r1) * gradient);
                                        let g = Math.floor(g1 + (g2 - g1) * gradient);
                                        let b = Math.floor(b1 + (b2 - b1) * gradient);
                                        positions[y * width + x] = [x, y, r, g, b];
                                    }
                                }
                            } else if (starting_location == "top") {
                                for (let x = x1; x <= x2; x++) {
                                    for (let y = y1; y <= y2; y++) {
                                        let gradient = (x - x1) / (x2 - x1);
                                        let r = Math.floor(r1 + (r2 - r1) * gradient);
                                        let g = Math.floor(g1 + (g2 - g1) * gradient);
                                        let b = Math.floor(b1 + (b2 - b1) * gradient);
                                        positions[y * width + x] = [x, y, r, g, b];
                                    }
                                }
                            } else if (starting_location == "bottom") {
                                for (let x = x1; x <= x2; x++) {
                                    for (let y = y1; y >= y2; y--) {
                                        let gradient = (x - x1) / (x2 - x1);
                                        let r = Math.floor(r1 + (r2 - r1) * gradient);
                                        let g = Math.floor(g1 + (g2 - g1) * gradient);
                                        let b = Math.floor(b1 + (b2 - b1) * gradient);
                                        positions[y * width + x] = [x, y, r, g, b];
                                    }
                                }
                            } else if (starting_location == "left") {
                                for (let x = x1; x <= x2; x++) {
                                    for (let y = y1; y <= y2; y++) {
                                        let gradient = (y - y1) / (y2 - y1);
                                        let r = Math.floor(r1 + (r2 - r1) * gradient);
                                        let g = Math.floor(g1 + (g2 - g1) * gradient);
                                        let b = Math.floor(b1 + (b2 - b1) * gradient);
                                        positions[y * width + x] = [x, y, r, g, b];
                                    }
                                }
                            } else if (starting_location == "right") {
                                for (let x = x1; x >= x2; x--) {
                                    for (let y = y1; y <= y2; y++) {
                                        let gradient = (y - y1) / (y2 - y1);
                                        let r = Math.floor(r1 + (r2 - r1) * gradient);
                                        let g = Math.floor(g1 + (g2 - g1) * gradient);
                                        let b = Math.floor(b1 + (b2 - b1) * gradient);
                                        positions[y * width + x] = [x, y, r, g, b];
                                    }
                                }
                            }
                        } else if (command.name == "L") {
                            checkPositions();

                            let x1 = parseInt(command.args[0]);
                            let y1 = parseInt(command.args[1]);
                            let x2 = parseInt(command.args[2]);
                            let y2 = parseInt(command.args[3]);
                            let r = parseInt(command.args[4]);
                            let g = parseInt(command.args[5]);
                            let b = parseInt(command.args[6]);

                            drawLine(positions, x1, y1, x2, y2, r, g, b, width);
                        } else if (command.name == "T") {
                            checkPositions();

                            let x1 = parseInt(command.args[0]);
                            let y1 = parseInt(command.args[1]);
                            let x2 = parseInt(command.args[2]);
                            let y2 = parseInt(command.args[3]);
                            let x3 = parseInt(command.args[4]);
                            let y3 = parseInt(command.args[5]);
                            let r = parseInt(command.args[6]);
                            let g = parseInt(command.args[7]);
                            let b = parseInt(command.args[8]);

                            drawLine(positions, x1, y1, x2, y2, r, g, b, width);
                            drawLine(positions, x2, y2, x3, y3, r, g, b, width);
                            drawLine(positions, x3, y3, x1, y1, r, g, b, width);

                            if (command.args[9] == "--fill") {
                                let pixels = [];

                                let pixels_on_line_1 = getPixelsOnLine(x1, y1, x2, y2);
                                let pixels_on_line_2 = getPixelsOnLine(x2, y2, x3, y3);
                                let pixels_on_line_3 = getPixelsOnLine(x3, y3, x1, y1);

                                for (let i = 0; i < pixels_on_line_1.length; i++) pixels.push(pixels_on_line_1[i]);
                                for (let i = 0; i < pixels_on_line_2.length; i++) pixels.push(pixels_on_line_2[i]);
                                for (let i = 0; i < pixels_on_line_3.length; i++) pixels.push(pixels_on_line_3[i]);

                                let inside = [];
                                let x_min = Math.min(x1, x2, x3);
                                let x_max = Math.max(x1, x2, x3);
                                let y_min = Math.min(y1, y2, y3);
                                let y_max = Math.max(y1, y2, y3);

                                for (let x = x_min; x <= x_max; x++) {
                                    for (let y = y_min; y <= y_max; y++) {
                                        let inside_triangle = (x, y, x1, y1, x2, y2, x3, y3) => {
                                            let d = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1);
                                            let e = (x - x2) * (y3 - y2) - (y - y2) * (x3 - x2);
                                            let f = (x - x3) * (y1 - y3) - (y - y3) * (x1 - x3);

                                            return d * e >= 0 && e * f >= 0;
                                        };
                                        const inside_triangle_result = inside_triangle(x, y, x1, y1, x2, y2, x3, y3);
                                        if (inside_triangle_result && !pixels.includes[[x, y]] && pixels.find(p => p[0] == x && p[1] == y) == undefined) {
                                            console.log('push ', [x, y],);
                                            inside.push([x, y]);
                                        }
                                    }
                                }

                                if (command.args[10] != undefined && command.args[11] != undefined && command.args[12] != undefined) {
                                    r = Number(command.args[10]);
                                    g = Number(command.args[11]);
                                    b = Number(command.args[12]);
                                }

                                for (let pixel of inside) {
                                    positions[pixel[1] * width + pixel[0]] = [pixel[0], pixel[1], r, g, b];
                                }
                            }
                        }
                    }
                })
            } else if (command.name.startsWith('//') || command.name.startsWith(' ') || command.name.startsWith('#')) {
                // ignore comments
                continue;
            } else {
                throw new Error(`Invalid command ${command.name}`);
            }
        }

        if (default_color != 'transparent') {
            for (let i = 0; i < positions.length; i++) {
                if (!positions[i])
                    positions[i] = [
                        i % width,
                        Math.floor(i / width),
                        default_color[0],
                        default_color[1],
                        default_color[2],
                    ];
            }
        }

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let pixel = positions[y * width + x];
                process.stdout.write(
                    `\x1b[38;2;${pixel[2]};${pixel[3]};${pixel[4]}m`
                );
                process.stdout.write("\u2588\u2588");
                process.stdout.write("\x1b[0m");
            }
            process.stdout.write("\n");
        }
    });
}

function writePng(file, width, height, pixels) {
    return new Jimp(width, height, (err, image) => {
        if (err) throw err;

        pixels.forEach((pixel) => {
            image.setPixelColor(
                Jimp.rgbaToInt(pixel.r, pixel.g, pixel.b, 255),
                pixel.x,
                pixel.y
            );
        });

        image.write(file, (err) => {
            if (err) throw err;
        });
    });
}

function getDimensions(file) {
    let png = PNG.sync.read(fs.readFileSync(file));
    return {
        width: png.width,
        height: png.height,
    };
}

function getPixel(file, x, y) {
    let png = PNG.sync.read(fs.readFileSync(file));
    let pixel = png.data[(y * png.width + x) * 4];
    return {
        r: pixel,
        g: png.data[(y * png.width + x) * 4 + 1],
        b: png.data[(y * png.width + x) * 4 + 2],
    };
}

function write(file, output, depth = -1, log = true) {
    if (!file.endsWith(".png") || !output.endsWith(".rpg"))
        throw new Error("Invalid file type.");

    let start = new Date();

    const dimensions = getDimensions(file);

    let outputLines = [];

    outputLines.push(`W ${dimensions.width}`);
    outputLines.push(`H ${dimensions.height}`);

    let coordinates = new Array(dimensions.width * dimensions.height);
    let coodinates_done = 0;
    for (let i = 0; i < coordinates.length; i++) {
        coordinates[i] = [
            i % dimensions.width,
            Math.floor(i / dimensions.width),
        ];
    }

    if (depth == -1) depth = dimensions.width * dimensions.height;

    for (let coordinate of coordinates) {
        if (depth == 0) break;
        if (process.stdin.read() == "stop") break;

        let pixel = getPixel(file, coordinate[0], coordinate[1]);
        const line = `D ${coordinate[0]} ${coordinate[1]} ${pixel.r} ${pixel.g} ${pixel.b}`;
        outputLines.push(`${line}`);
        coodinates_done += 1;
        if (log)
            process.stdout.write(
                `Added line ${line} ${coodinates_done}/${coordinates.length}\n`
            );
        depth--;
    }

    if (log) for (let i = 0; i < 30; i++) process.stdout.write("\n");

    let end = new Date();

    let time = (end.getTime() - start.getTime()) / 1000;
    let pixels_per_second = coodinates_done / time;

    if (log) {
        console.log(`\nTime taken: ${time} seconds.`);
        console.log(`Pixels per second: ${pixels_per_second}`);
    }

    fs.writeFile(output, outputLines.join("\n"), (err) => {
        if (err) throw err;
    });
}

function writeAndRead(file, output, depth = -1, log = true) {
    write(file, output, depth, log);
    read(output);
}

function compile(file, output) {
    if (!file.endsWith(".rpg") || !output.endsWith(".png"))
        throw new Error("Invalid file type.");

    let lines = fs.readFileSync(file, "utf8").split("\n");

    let width = 0;
    let height = 0;
    let default_color = [0, 0, 0];

    let positions;
    let pixels = [];

    for (let line in lines) {
        line = lines[line];

        let command = parseCommand(line);
        if (command.name == "W") {
            width = Number(command.args[0]);
        } else if (command.name == "H") {
            height = Number(command.args[0]);
        } else if (command.name == "D") {
            if (!positions) positions = new Array(width * height);
            let x = Number(command.args[0]);
            let y = Number(command.args[1]);
            let r = Number(command.args[2]);
            let g = Number(command.args[3]);
            let b = Number(command.args[4]);
            positions[y * width + x] = [x, y, r, g, b];
        } else if (command.name == "--DEFAULT-COLOR") {
            if (command.args[0] == "--TRANSPARENT") {
                default_color = "transparent";
            }
            default_color = [
                Number(command.args[0]),
                Number(command.args[1]),
                Number(command.args[2]),
            ];
        }
    }

    if (default_color != 'transparent') {
        for (let i = 0; i < positions.length; i++) {
            if (!positions[i])
                positions[i] = [
                    i % width,
                    Math.floor(i / width),
                    default_color[0],
                    default_color[1],
                    default_color[2],
                ];
        }
    }

    for (let position of positions) {
        pixels.push({
            r: position[2],
            g: position[3],
            b: position[4],
            x: position[0],
            y: position[1],
        });
    }

    writePng(output, width, height, pixels);
}

read('example.rpg');

module.exports = {
    read,
    write,
    compile
}
