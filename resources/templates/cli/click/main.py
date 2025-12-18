"""
{{PROJECT_NAME}} - CLI Application with Click
"""
import click


@click.group()
@click.version_option(version="0.1.0")
def cli():
    """{{PROJECT_NAME}} - A CLI application built with Click."""
    pass


@cli.command()
@click.option("--name", default="World", help="Name to greet")
def hello(name: str):
    """Say hello to someone."""
    click.echo(click.style(f"Hello, {name}!", fg="green"))


@cli.command()
@click.argument("name")
def goodbye(name: str):
    """Say goodbye to someone."""
    click.echo(click.style(f"Goodbye, {name}!", fg="yellow"))


if __name__ == "__main__":
    cli()
