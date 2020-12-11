
import React, { Component } from 'react';
import {
    NativeModules,
    PanResponder,
    Dimensions,
    Image,
    View,
    Animated,
    Platform
} from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

class CustomCrop extends Component {
    constructor(props) {
        super(props);
        this.state = {
            viewHeight:
                Dimensions.get('window').width * (props.height / props.width),
            viewWidth: Dimensions.get('window').width,
            height: props.height,
            width: props.width,
            image: props.initialImage,
            moving: false,
            screenRatio: Dimensions.get('screen').height / Dimensions.get('screen').width
        };

        this.state = {
            ...this.state,
            topLeft: new Animated.ValueXY(
                props.rectangleCoordinates
                    ? this.imageCoordinatesToViewCoordinates(
                        {
                            x: Platform.OS === 'android' ? props.rectangleCoordinates.topLeft.x
                                : props.rectangleCoordinates.topLeft.x * this.getCoordinateScaling(),
                            y: Platform.OS === 'android' ? props.rectangleCoordinates.topLeft.y
                                : props.rectangleCoordinates.topLeft.y * this.getCoordinateScaling()
                        },
                        true,
                    )
                    : { x: 100, y: 100 },
            ),
            topRight: new Animated.ValueXY(
                props.rectangleCoordinates
                    ? this.imageCoordinatesToViewCoordinates(
                        {
                            x: Platform.OS === 'android' ?
                                props.rectangleCoordinates.topRight.x :
                                props.rectangleCoordinates.bottomLeft.x * this.getCoordinateScaling(),
                            y: Platform.OS === 'android' ? props.rectangleCoordinates.topRight.y
                                : props.rectangleCoordinates.bottomLeft.y * this.getCoordinateScaling()
                        },
                        true,
                    )
                    : { x: this.state.viewWidth - 100, y: 100 },
            ),
            bottomLeft: new Animated.ValueXY(
                props.rectangleCoordinates
                    ? this.imageCoordinatesToViewCoordinates(
                        {
                            x: Platform.OS === 'android' ?
                                props.rectangleCoordinates.bottomLeft.x :
                                props.rectangleCoordinates.topRight.x * this.getCoordinateScaling(),
                            y: Platform.OS === 'android' ? props.rectangleCoordinates.bottomLeft.y
                                : props.rectangleCoordinates.topRight.y * this.getCoordinateScaling()
                        },
                        true,
                    )
                    : { x: 100, y: this.state.viewHeight - 100 },
            ),
            bottomRight: new Animated.ValueXY(
                props.rectangleCoordinates
                    ? this.imageCoordinatesToViewCoordinates(
                        {
                            x: Platform.OS === 'android' ?
                                props.rectangleCoordinates.bottomRight.x :
                                props.rectangleCoordinates.bottomRight.x * this.getCoordinateScaling(),
                            y: Platform.OS === 'android' ? props.rectangleCoordinates.bottomRight.y
                                : props.rectangleCoordinates.bottomRight.y * this.getCoordinateScaling()
                        },
                        true,
                    )
                    : {
                        x: this.state.viewWidth - 100,
                        y: this.state.viewHeight - 100,
                    },
            ),
        };
        this.state = {
            ...this.state,
            overlayPositions: `${this.state.topLeft.x._value},${this.state.topLeft.y._value
                } ${this.state.topRight.x._value},${this.state.topRight.y._value} ${this.state.bottomRight.x._value
                },${this.state.bottomRight.y._value} ${this.state.bottomLeft.x._value
                },${this.state.bottomLeft.y._value}`,
        };

        this.panResponderTopLeft = this.createPanResponser(this.state.topLeft);
        this.panResponderTopRight = this.createPanResponser(
            this.state.topRight,
        );
        this.panResponderBottomLeft = this.createPanResponser(
            this.state.bottomLeft,
        );
        this.panResponderBottomRight = this.createPanResponser(
            this.state.bottomRight,
        );
    }

    createPanResponser(corner) {
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: Animated.event([
                null,
                {
                    dx: corner.x,
                    dy: corner.y,
                },
            ]),
            onPanResponderRelease: () => {
                corner.flattenOffset();
                this.updateOverlayString();
            },
            onPanResponderGrant: () => {
                corner.setOffset({ x: corner.x._value, y: corner.y._value });
                corner.setValue({ x: 0, y: 0 });
            },
        });
    }

    crop() {
        const coordinates = {
            topLeft: this.viewCoordinatesToImageCoordinates(this.state.topLeft),
            topRight: this.viewCoordinatesToImageCoordinates(
                this.state.topRight,
            ),
            bottomLeft: this.viewCoordinatesToImageCoordinates(
                this.state.bottomLeft,
            ),
            bottomRight: this.viewCoordinatesToImageCoordinates(
                this.state.bottomRight,
            ),
            height: this.state.height,
            width: this.state.width,
        };
        NativeModules.CustomCropManager.crop(
            coordinates,
            this.state.image,
            (err, res) => this.props.updateImage(res.image, coordinates),
        );
    }

    updateOverlayString() {
        this.setState({
            overlayPositions: `${this.state.topLeft.x._value},${this.state.topLeft.y._value
                } ${this.state.topRight.x._value},${this.state.topRight.y._value} ${this.state.bottomRight.x._value
                },${this.state.bottomRight.y._value} ${this.state.bottomLeft.x._value
                },${this.state.bottomLeft.y._value}`,
        });
    }

    imageCoordinatesToViewCoordinates(corner) {
        return {
            x: (corner.x * this.state.viewWidth) / this.state.width,
            y: (corner.y * this.state.viewHeight) / this.state.height,
        };
    }

    viewCoordinatesToImageCoordinates(corner) {
        return {
            x: (corner.x._value / this.state.viewWidth) *
                this.state.width,
            y: (corner.y._value / this.state.viewHeight) * this.state.height
        };
    };

    getCoordinateScaling() {
        return (this.props.width / this.state.viewHeight) * 1.20
    }

    render() {

        return (
            <View
                style={{
                    height: this.state.viewHeight,
                    width: this.state.viewWidth,
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                }}
            >
                <View
                    style={[
                        s(this.props).cropContainer,
                        { height: this.state.viewHeight },
                    ]}
                >
                    <Image
                        style={[
                            s(this.props).image,
                            { height: this.state.viewHeight },
                        ]}
                        resizeMode="contain"
                        source={{ uri: this.state.image }}
                    />
                    <Svg
                        height={this.state.viewHeight}
                        width={this.state.viewWidth}
                        style={{ position: 'absolute', left: 0, top: 0 }}
                    >
                        <AnimatedPolygon
                            ref={(ref) => (this.polygon = ref)}
                            fill={this.props.overlayColor || 'blue'}
                            fillOpacity={this.props.overlayOpacity || 0.5}
                            stroke={this.props.overlayStrokeColor || 'blue'}
                            points={this.state.overlayPositions}
                            strokeWidth={this.props.overlayStrokeWidth || 3}
                        />
                    </Svg>
                    <Animated.View
                        {...this.panResponderTopLeft.panHandlers}
                        style={[
                            this.state.topLeft.getLayout(),
                            s(this.props).handler,
                        ]}
                    >
                        <View
                            style={[
                                s(this.props).handlerI,
                                { left: 0, top: 0 },
                            ]}
                        />
                        <View
                            style={[
                                s(this.props).handlerRound,
                                { left: 50, top: 50 },
                            ]}
                        />
                        <View
                            style={[
                                s(this.props).handlerRoundOuter,
                                { left: 30, top: 30 },
                            ]}
                        />
                    </Animated.View>
                    <>
                        <Animated.View
                            {...this.panResponderTopRight.panHandlers}
                            style={[
                                this.state.topRight.getLayout(),
                                s(this.props).handler,
                            ]}
                        >
                            <View
                                style={[
                                    s(this.props).handlerI,
                                    { left: 0, top: 0 },
                                ]}
                            />
                            <View
                                style={[
                                    s(this.props).handlerRound,
                                    { left: 51, bottom: 51 },
                                ]}
                            />
                            <View
                                style={[
                                    s(this.props).handlerRoundOuter,
                                    { left: 30, bottom: 30 },
                                ]}
                            />
                        </Animated.View>
                        <Animated.View
                            {...this.panResponderBottomLeft.panHandlers}
                            style={[
                                this.state.bottomLeft.getLayout(),
                                s(this.props).handler,
                            ]}
                        >
                            <View
                                style={[
                                    s(this.props).handlerI,
                                    { left: 0, top: 0 },
                                ]}
                            />
                            <View
                                style={[
                                    s(this.props).handlerRound,
                                    { right: 47, top: 50 },
                                ]}
                            />
                            <View
                                style={[
                                    s(this.props).handlerRoundOuter,
                                    { right: 30, top: 30 },
                                ]}
                            />
                        </Animated.View>
                    </>
                    <Animated.View
                        {...this.panResponderBottomRight.panHandlers}
                        style={[
                            this.state.bottomRight.getLayout(),
                            s(this.props).handler,
                        ]}
                    >
                        <View
                            style={[
                                s(this.props).handlerI,
                                { left: 0, top: 0 },
                            ]}
                        />
                        <View
                            style={[
                                s(this.props).handlerRound,
                                { right: 47, bottom: 53 },
                            ]}
                        />
                        <View
                            style={[
                                s(this.props).handlerRoundOuter,
                                { right: 27, bottom: 33 },
                            ]}
                        />
                    </Animated.View>
                </View>
            </View>
        );
    }
}

const s = (props) => ({
    handlerI: {
        borderRadius: 50,
        height: 10,
        width: 0,
        backgroundColor: props.handlerColor || 'blue',
        zIndex: 9999
    },
    handlerRound: {
        width: 31.2,
        position: 'absolute',
        height: 29.6,
        borderRadius: 100,
        backgroundColor: props.handlerColor || 'blue',
        zIndex: 9999,
        borderWidth: 2,
        borderColor: props.borderColor || 'blue'
    },
    handlerRoundOuter: {
        width: 70.2,
        position: 'absolute',
        height: 70.2,
        borderRadius: 150,
        backgroundColor: props.handlerOuterColor || 'blue',
        zIndex: 9998
    },
    image: {
        width: Dimensions.get('window').width,
        position: 'absolute',
    },
    handler: {
        height: 140,
        width: 140,
        overflow: 'visible',
        marginLeft: -70,
        marginTop: -70,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
    },
    cropContainer: {
        position: 'absolute',
        left: 0,
        width: Dimensions.get('window').width,
        top: 0,
    },
});

export default CustomCrop;