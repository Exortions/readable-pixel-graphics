import inquirer from "inquirer";
import { read, write, compile } from "./compiler";
import arg from "arg";

function parseArgumentsIntoOptions(rawArgs) {
    const args = arg(
        {
            "--file": String,
            "--output": String,
            "--help": Boolean,
            "-f": "--file",
            "-o": "--output",
            "-h": "--help",
            "--out": "--output",
        },
        {
            argv: rawArgs.slice(2),
        }
    );
    return {
        file: args["--file"],
        output: args["--output"],
        help: args["--help"] || false,
        command: args._[0] || "none",
    };
}

async function promptForMissingOptions(options) {
    if (options.command === "none") {
        const questions = [];

        questions.push({
            type: "list",
            name: "command",
            message: "What would you like to do?",
            choices: ["Compile", "Decompile", "Log", "Exit"],
        });

        const answers = await inquirer.prompt(questions);
        options.command = answers.command.toLowerCase();
    }

    if (options.command === "compile" || options.command === "decompile") {
        const questions = [];
        if (!options.file) {
            questions.push({
                type: "input",
                name: "file",
                message: "Enter the file to read",
            });
        }

        if (!options.output) {
            questions.push({
                type: "input",
                name: "output",
                message: "Enter the file to write",
            });
        }

        const answers = await inquirer.prompt(questions);
        return {
            ...options,
            file: options.file || answers.file,
            output: options.output || answers.output,
        };
    }

    if (options.command === "log") {
        const questions = [];
        if (!options.file) {
            questions.push({
                type: "input",
                name: "file",
                message: "Enter the file to read",
            });
        }

        const answers = await inquirer.prompt(questions);
        return {
            ...options,
            file: options.file || answers.file,
        };
    }

    if (options.command == 'exit') process.exit();

    console.log("Unknown command: " + options.command);
    return "unknown";
}

function execute_command(options) {
    if (options.command == "compile") {
        console.log(`Compiling ${options.file} to ${options.output}...`);
        compile(options.file, options.output);
        console.log(`Compiled ${options.file} to ${options.output}.`);
    } else if (options.command == "decompile") {
        console.log(`Decompiling ${options.file} to ${options.output}...`);
        write(options.file, options.output);
        console.log(`Decompiled ${options.file} to ${options.output}.`);
    } else if (options.command == "log") {
        console.log(`${options.file}: `);
        read(options.file);
    }
    cli([[process.argv[0]], [process.argv[1]]]);
}

export async function cli(args) {
    let options = parseArgumentsIntoOptions(args);
    if (options.help) {
        console.log(`
            Usage: rpg <command> [--file <file>] [--output <file>] [--help]

            Commands:
                compile - Compile a .rpg file into a .png file
                decompile - Decompile a .png file into a .rpg file
                log - Log the image of a .rpg file

            Options:
                --file - The file to read
                --output - The file to write
                --help - Show this help message
            
        `);
        return;
    }
    if (options.command !== "none") {
        options.command = options.command.toLowerCase();
    }
    if (options.command === "exit") process.exit();
    options = await promptForMissingOptions(options);
    if (options === "unknown") return;
    execute_command(options);
}
