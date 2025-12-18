"""
{{PROJECT_NAME}} - CLI Application with Typer
"""
import typer
from rich import print as rprint

app = typer.Typer(
    name="{{PROJECT_NAME}}",
    help="A CLI application built with Typer",
    add_completion=False,
)


@app.command()
def hello(name: str = typer.Option("World", help="Name to greet")):
    """Say hello to someone."""
    rprint(f"[green]Hello, {name}![/green]")


@app.command()
def goodbye(name: str = typer.Argument(..., help="Name to say goodbye to")):
    """Say goodbye to someone."""
    rprint(f"[yellow]Goodbye, {name}![/yellow]")


if __name__ == "__main__":
    app()
